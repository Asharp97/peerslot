import { randomUUID } from "node:crypto";

import { and, asc, eq, notExists, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { appointments, availabilitySlots, providerStudents } from "@/db/schema";
import { findBookingPage } from "@/lib/booking-pages";
import { isPostgresError } from "@/lib/database-errors";
import {
  expandProviderAppointmentOccurrences,
  findAppointmentConflictInRows,
} from "@/lib/provider-appointment-occurrence";
import { appointmentTimesChanged } from "@/lib/provider-appointment";
import type {
  ProviderAppointmentCreateInput,
  ProviderAppointmentUpdateInput,
  ProviderStudentCreateInput,
  ProviderStudentUpdateInput,
} from "@/lib/provider-appointment";

export class ProviderAppointmentConflictError extends Error {
  studentName?: string;

  constructor(
    message = "This time overlaps another scheduled appointment",
    studentName?: string,
  ) {
    super(message);
    this.name = "ProviderAppointmentConflictError";
    this.studentName = studentName;
  }
}

export class ProviderAppointmentNotFoundError extends Error {
  constructor() {
    super("Appointment not found");
    this.name = "ProviderAppointmentNotFoundError";
  }
}

export class ProviderAppointmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderAppointmentValidationError";
  }
}

export class ProviderStudentNotFoundError extends Error {
  constructor() {
    super("Student not found");
    this.name = "ProviderStudentNotFoundError";
  }
}

const appointmentSelection = {
  id: appointments.id,
  slotId: availabilitySlots.id,
  windowId: availabilitySlots.availabilityWindowId,
  accountStudentName: user.name,
  accountStudentEmail: user.email,
  providerStudentId: providerStudents.id,
  providerStudentName: providerStudents.displayName,
  providerStudentEmail: providerStudents.email,
  startsAt: availabilitySlots.startsAt,
  endsAt: availabilitySlots.endsAt,
  recurrence: appointments.recurrence,
  exceptionForAppointmentId: appointments.exceptionForAppointmentId,
  exceptionOriginalStartsAt: appointments.exceptionOriginalStartsAt,
  status: appointments.status,
  comment: appointments.comment,
  examName: appointments.examName,
  schoolYear: appointments.schoolYear,
  color: appointments.color,
  createdByProvider: appointments.createdByProvider,
  rescheduleCount: appointments.rescheduleCount,
  createdAt: appointments.createdAt,
};

export async function listProviderStudents(providerId: string) {
  return db
    .select()
    .from(providerStudents)
    .where(
      and(
        eq(providerStudents.providerId, providerId),
        eq(providerStudents.isActive, true),
      ),
    )
    .orderBy(asc(providerStudents.displayName));
}

export async function createProviderStudent(
  providerId: string,
  input: ProviderStudentCreateInput,
) {
  try {
    const [student] = await db
      .insert(providerStudents)
      .values({ providerId, ...input })
      .returning();
    return student;
  } catch (error) {
    if (!input.email || !isPostgresError(error, "23505")) throw error;

    const [existing] = await db
      .select()
      .from(providerStudents)
      .where(
        and(
          eq(providerStudents.providerId, providerId),
          eq(providerStudents.email, input.email),
        ),
      )
      .limit(1);

    if (!existing) throw error;
    if (existing.isActive) return existing;

    const [reactivated] = await db
      .update(providerStudents)
      .set({
        displayName: input.displayName,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(providerStudents.id, existing.id))
      .returning();
    return reactivated;
  }
}

export async function updateProviderStudent(
  providerId: string,
  studentId: string,
  input: ProviderStudentUpdateInput,
) {
  try {
    const [student] = await db
      .update(providerStudents)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(providerStudents.id, studentId),
          eq(providerStudents.providerId, providerId),
          eq(providerStudents.isActive, true),
        ),
      )
      .returning();

    if (!student) throw new ProviderStudentNotFoundError();
    return student;
  } catch (error) {
    if (isPostgresError(error, "23505")) {
      throw new ProviderAppointmentConflictError(
        "A student with this email already exists",
      );
    }
    throw error;
  }
}

export async function archiveProviderStudent(
  providerId: string,
  studentId: string,
) {
  const [student] = await db
    .update(providerStudents)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(providerStudents.id, studentId),
        eq(providerStudents.providerId, providerId),
        eq(providerStudents.isActive, true),
      ),
    )
    .returning({ id: providerStudents.id });

  if (!student) throw new ProviderStudentNotFoundError();
  return { archived: true, id: student.id };
}

export async function listProviderAppointments(
  providerId: string,
  range: { startsAt: Date; endsAt: Date },
) {
  const [rows, bookingPage] = await Promise.all([
    loadProviderAppointmentRows(providerId),
    findBookingPage(providerId),
  ]);

  return expandProviderAppointmentOccurrences(
    rows,
    range,
    bookingPage?.timeZone ?? "UTC",
  );
}

export async function createProviderAppointment(
  providerId: string,
  input: ProviderAppointmentCreateInput,
) {
  await requireProviderStudent(providerId, input.providerStudentId);
  await assertNoAppointmentOverlap(providerId, input);

  const appointmentId = await insertAppointment(providerId, {
    ...input,
    createdByProvider: true,
  });
  return requireProviderAppointment(providerId, appointmentId);
}

export async function updateProviderAppointment(
  providerId: string,
  appointmentId: string,
  input: ProviderAppointmentUpdateInput,
) {
  const current = await requireProviderAppointment(providerId, appointmentId);

  if (
    input.editScope === "exception" &&
    current.recurrence === "weekly" &&
    !current.exceptionForAppointmentId
  ) {
    return createAppointmentException(providerId, current, input);
  }

  const seriesTarget =
    input.editScope === "series" && current.exceptionForAppointmentId
      ? await requireProviderAppointment(
          providerId,
          current.exceptionForAppointmentId,
        )
      : current;
  const updated = await updateAppointmentRecord(
    providerId,
    seriesTarget,
    input,
  );

  if (
    input.editScope === "series" &&
    current.exceptionForAppointmentId &&
    current.id !== seriesTarget.id
  ) {
    await deleteAppointmentRecord(current);
  }

  return updated;
}

async function createAppointmentException(
  providerId: string,
  series: Awaited<ReturnType<typeof requireProviderAppointment>>,
  input: ProviderAppointmentUpdateInput,
) {
  if (!input.occurrenceStartsAt) {
    throw new ProviderAppointmentValidationError(
      "The selected recurring occurrence is required",
    );
  }

  const duration = series.endsAt.getTime() - series.startsAt.getTime();
  const range = {
    startsAt: input.startsAt ?? input.occurrenceStartsAt,
    endsAt:
      input.endsAt ?? new Date(input.occurrenceStartsAt.getTime() + duration),
  };
  await assertNoAppointmentOverlap(
    providerId,
    { ...range, recurrence: "none" },
    {
      excludedOccurrence: {
        appointmentId: series.id,
        startsAt: input.occurrenceStartsAt,
      },
    },
  );

  const appointmentId = await insertAppointment(providerId, {
    providerStudentId: series.providerStudentId!,
    ...range,
    recurrence: "none",
    exceptionForAppointmentId: series.id,
    exceptionOriginalStartsAt: input.occurrenceStartsAt,
    comment:
      input.comment !== undefined
        ? input.comment
        : (series.comment ?? undefined),
    examName:
      input.examName !== undefined
        ? input.examName
        : (series.examName ?? undefined),
    schoolYear:
      input.schoolYear !== undefined
        ? input.schoolYear
        : (series.schoolYear ?? undefined),
    color: input.color ?? series.color,
    status: input.status ?? series.status,
    createdByProvider: true,
    rescheduleCount: sql`${series.rescheduleCount} + 1`,
  });

  return requireProviderAppointment(providerId, appointmentId);
}

async function updateAppointmentRecord(
  providerId: string,
  current: Awaited<ReturnType<typeof requireProviderAppointment>>,
  input: ProviderAppointmentUpdateInput,
) {
  const comparisonRange =
    current.recurrence === "weekly" && input.occurrenceStartsAt
      ? {
          startsAt: input.occurrenceStartsAt,
          endsAt: new Date(
            input.occurrenceStartsAt.getTime() +
              (current.endsAt.getTime() - current.startsAt.getTime()),
          ),
        }
      : current;
  const timesChanged = appointmentTimesChanged(input, comparisonRange);
  const appointmentUpdate = {
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    ...(input.examName !== undefined ? { examName: input.examName } : {}),
    ...(input.schoolYear !== undefined ? { schoolYear: input.schoolYear } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.color !== undefined ? { color: input.color } : {}),
    ...(timesChanged
      ? { rescheduleCount: sql`${appointments.rescheduleCount} + 1` }
      : {}),
    updatedAt: new Date(),
  };

  if (!timesChanged) {
    await db
      .update(appointments)
      .set(appointmentUpdate)
      .where(eq(appointments.id, current.id));
    return requireProviderAppointment(providerId, current.id);
  }

  const range = { startsAt: input.startsAt!, endsAt: input.endsAt! };
  await assertNoAppointmentOverlap(
    providerId,
    { ...range, recurrence: current.recurrence },
    current.recurrence === "weekly"
      ? { excludedSeriesId: current.id }
      : { excludedAppointmentId: current.id },
  );

  const targetSlot = await findOpenSlot(providerId, range);
  const targetSlotId = targetSlot?.id ?? randomUUID();
  const shouldDeleteOldSlot = current.windowId === null;

  try {
    const updateQuery = db
      .update(appointments)
      .set({ ...appointmentUpdate, slotId: targetSlotId })
      .where(eq(appointments.id, current.id));
    const deleteOldSlot = db
      .delete(availabilitySlots)
      .where(eq(availabilitySlots.id, current.slotId));

    if (targetSlot) {
      await db.batch(
        shouldDeleteOldSlot && current.slotId !== targetSlotId
          ? [updateQuery, deleteOldSlot]
          : [updateQuery],
      );
    } else {
      const insertSlot = db.insert(availabilitySlots).values({
        id: targetSlotId,
        teacherId: providerId,
        ...range,
      });
      await db.batch(
        shouldDeleteOldSlot
          ? [insertSlot, updateQuery, deleteOldSlot]
          : [insertSlot, updateQuery],
      );
    }
  } catch (error) {
    if (isPostgresError(error, "23505")) {
      throw new ProviderAppointmentConflictError();
    }
    throw error;
  }

  return requireProviderAppointment(providerId, current.id);
}

type InsertAppointmentInput = {
  providerStudentId: string;
  startsAt: Date;
  endsAt: Date;
  recurrence: "none" | "weekly";
  exceptionForAppointmentId?: string;
  exceptionOriginalStartsAt?: Date;
  comment?: string | null;
  examName?: string | null;
  schoolYear?: string | null;
  color: string;
  status?: "scheduled" | "cancelled";
  createdByProvider: boolean;
  rescheduleCount?: number | ReturnType<typeof sql>;
};

async function insertAppointment(
  providerId: string,
  input: InsertAppointmentInput,
) {
  const slot = await findOpenSlot(providerId, input);
  const appointmentId = randomUUID();
  const appointmentValues = {
    id: appointmentId,
    providerStudentId: input.providerStudentId,
    slotId: slot?.id ?? randomUUID(),
    recurrence: input.recurrence,
    exceptionForAppointmentId: input.exceptionForAppointmentId,
    exceptionOriginalStartsAt: input.exceptionOriginalStartsAt,
    comment: input.comment,
    examName: input.examName,
    schoolYear: input.schoolYear,
    color: input.color,
    status: input.status,
    createdByProvider: input.createdByProvider,
    rescheduleCount: input.rescheduleCount,
  };

  try {
    if (slot) {
      await db.insert(appointments).values(appointmentValues);
    } else {
      await db.batch([
        db.insert(availabilitySlots).values({
          id: appointmentValues.slotId,
          teacherId: providerId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        }),
        db.insert(appointments).values(appointmentValues),
      ]);
    }
  } catch (error) {
    if (isPostgresError(error, "23505")) {
      throw new ProviderAppointmentConflictError();
    }
    throw error;
  }

  return appointmentId;
}

async function deleteAppointmentRecord(
  appointment: Awaited<ReturnType<typeof requireProviderAppointment>>,
) {
  await db.batch([
    db.delete(appointments).where(eq(appointments.id, appointment.id)),
    ...(appointment.windowId === null
      ? [
          db
            .delete(availabilitySlots)
            .where(eq(availabilitySlots.id, appointment.slotId)),
        ]
      : []),
  ]);
}

async function requireProviderStudent(providerId: string, studentId: string) {
  const [student] = await db
    .select()
    .from(providerStudents)
    .where(
      and(
        eq(providerStudents.id, studentId),
        eq(providerStudents.providerId, providerId),
        eq(providerStudents.isActive, true),
      ),
    )
    .limit(1);

  if (!student) throw new ProviderStudentNotFoundError();
  return student;
}

async function requireProviderAppointment(
  providerId: string,
  appointmentId: string,
) {
  const [row] = await appointmentQuery()
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(availabilitySlots.teacherId, providerId),
      ),
    )
    .limit(1);

  if (!row) throw new ProviderAppointmentNotFoundError();
  return presentAppointmentRow(row);
}

export async function loadProviderAppointmentRows(providerId: string) {
  const rows = await appointmentQuery().where(
    eq(availabilitySlots.teacherId, providerId),
  );
  return rows.map(presentAppointmentRow);
}

function appointmentQuery() {
  return db
    .select(appointmentSelection)
    .from(appointments)
    .innerJoin(availabilitySlots, eq(availabilitySlots.id, appointments.slotId))
    .leftJoin(user, eq(user.id, appointments.studentId))
    .leftJoin(
      providerStudents,
      eq(providerStudents.id, appointments.providerStudentId),
    );
}

function presentAppointmentRow(
  row: Awaited<
    ReturnType<ReturnType<typeof appointmentQuery>["limit"]>
  >[number],
) {
  const { accountStudentName, accountStudentEmail, ...appointment } = row;
  return {
    ...appointment,
    studentName:
      appointment.providerStudentName ?? accountStudentName ?? "Student",
    studentEmail:
      appointment.providerStudentEmail ?? accountStudentEmail ?? null,
  };
}

async function assertNoAppointmentOverlap(
  providerId: string,
  candidate: {
    startsAt: Date;
    endsAt: Date;
    recurrence: "none" | "weekly";
  },
  exclusions?: Parameters<typeof findAppointmentConflictInRows>[3],
) {
  const [rows, bookingPage] = await Promise.all([
    loadProviderAppointmentRows(providerId),
    findBookingPage(providerId),
  ]);
  const overlap = findAppointmentConflictInRows(
    rows,
    candidate,
    bookingPage?.timeZone ?? "UTC",
    exclusions,
  );

  if (overlap) {
    throw new ProviderAppointmentConflictError(
      `This time overlaps ${overlap.studentName}'s scheduled session`,
      overlap.studentName,
    );
  }
}

async function findOpenSlot(
  providerId: string,
  range: { startsAt: Date; endsAt: Date },
) {
  const [slot] = await db
    .select({ id: availabilitySlots.id })
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.teacherId, providerId),
        eq(availabilitySlots.startsAt, range.startsAt),
        eq(availabilitySlots.endsAt, range.endsAt),
        notExists(
          db
            .select({ id: appointments.id })
            .from(appointments)
            .where(eq(appointments.slotId, availabilitySlots.id)),
        ),
      ),
    )
    .limit(1);

  return slot ?? null;
}
