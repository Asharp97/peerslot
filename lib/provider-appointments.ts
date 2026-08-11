import { randomUUID } from "node:crypto";

import { and, asc, eq, gt, lt, ne, notExists, sql } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { appointments, availabilitySlots, providerStudents } from "@/db/schema";
import { isPostgresError } from "@/lib/database-errors";
import { appointmentTimesChanged } from "@/lib/provider-appointment";
import type {
  ProviderAppointmentCreateInput,
  ProviderAppointmentUpdateInput,
  ProviderStudentCreateInput,
} from "@/lib/provider-appointment";

export class ProviderAppointmentConflictError extends Error {
  constructor() {
    super("This time overlaps another scheduled appointment");
    this.name = "ProviderAppointmentConflictError";
  }
}

export class ProviderAppointmentNotFoundError extends Error {
  constructor() {
    super("Appointment not found");
    this.name = "ProviderAppointmentNotFoundError";
  }
}

export class ProviderStudentNotFoundError extends Error {
  constructor() {
    super("Student not found");
    this.name = "ProviderStudentNotFoundError";
  }
}

export async function listProviderStudents(providerId: string) {
  return db
    .select()
    .from(providerStudents)
    .where(eq(providerStudents.providerId, providerId))
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

    const [student] = await db
      .select()
      .from(providerStudents)
      .where(
        and(
          eq(providerStudents.providerId, providerId),
          eq(providerStudents.email, input.email),
        ),
      )
      .limit(1);

    if (student) return student;
    throw error;
  }
}

export async function listProviderAppointments(
  providerId: string,
  range: { startsAt: Date; endsAt: Date },
) {
  const rows = await db
    .select({
      id: appointments.id,
      windowId: availabilitySlots.availabilityWindowId,
      accountStudentName: user.name,
      accountStudentEmail: user.email,
      providerStudentId: providerStudents.id,
      providerStudentName: providerStudents.displayName,
      providerStudentEmail: providerStudents.email,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
      status: appointments.status,
      comment: appointments.comment,
      examName: appointments.examName,
      schoolYear: appointments.schoolYear,
      createdByProvider: appointments.createdByProvider,
      rescheduleCount: appointments.rescheduleCount,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(availabilitySlots.id, appointments.slotId))
    .leftJoin(user, eq(user.id, appointments.studentId))
    .leftJoin(
      providerStudents,
      eq(providerStudents.id, appointments.providerStudentId),
    )
    .where(
      and(
        eq(availabilitySlots.teacherId, providerId),
        lt(availabilitySlots.startsAt, range.endsAt),
        gt(availabilitySlots.endsAt, range.startsAt),
      ),
    )
    .orderBy(asc(availabilitySlots.startsAt));

  return rows.map(({ accountStudentName, accountStudentEmail, ...row }) => ({
    ...row,
    studentName: row.providerStudentName ?? accountStudentName ?? "Student",
    studentEmail: row.providerStudentEmail ?? accountStudentEmail ?? null,
  }));
}

export async function createProviderAppointment(
  providerId: string,
  input: ProviderAppointmentCreateInput,
) {
  await requireProviderStudent(providerId, input.providerStudentId);
  await assertNoAppointmentOverlap(providerId, input);

  const slot = await findOpenSlot(providerId, input);
  const appointmentId = randomUUID();

  if (slot) {
    await db.insert(appointments).values({
      id: appointmentId,
      providerStudentId: input.providerStudentId,
      slotId: slot.id,
      comment: input.comment,
      examName: input.examName,
      schoolYear: input.schoolYear,
      createdByProvider: true,
    });
  } else {
    const slotId = randomUUID();
    try {
      await db.batch([
        db.insert(availabilitySlots).values({
          id: slotId,
          teacherId: providerId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        }),
        db.insert(appointments).values({
          id: appointmentId,
          providerStudentId: input.providerStudentId,
          slotId,
          comment: input.comment,
          examName: input.examName,
          schoolYear: input.schoolYear,
          createdByProvider: true,
        }),
      ]);
    } catch (error) {
      if (isPostgresError(error, "23505")) {
        throw new ProviderAppointmentConflictError();
      }
      throw error;
    }
  }

  return requireProviderAppointment(providerId, appointmentId);
}

export async function updateProviderAppointment(
  providerId: string,
  appointmentId: string,
  input: ProviderAppointmentUpdateInput,
) {
  const current = await requireProviderAppointment(providerId, appointmentId);
  const timesChanged = appointmentTimesChanged(input, current);
  const appointmentUpdate = {
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    ...(input.examName !== undefined ? { examName: input.examName } : {}),
    ...(input.schoolYear !== undefined ? { schoolYear: input.schoolYear } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(timesChanged
      ? { rescheduleCount: sql`${appointments.rescheduleCount} + 1` }
      : {}),
    updatedAt: new Date(),
  };

  if (!timesChanged) {
    await db
      .update(appointments)
      .set(appointmentUpdate)
      .where(eq(appointments.id, appointmentId));
    return requireProviderAppointment(providerId, appointmentId);
  }

  const range = { startsAt: input.startsAt!, endsAt: input.endsAt! };
  await assertNoAppointmentOverlap(providerId, range, appointmentId);

  const targetSlot = await findOpenSlot(providerId, range);
  const targetSlotId = targetSlot?.id ?? randomUUID();
  const shouldDeleteOldSlot = current.windowId === null;

  try {
    if (targetSlot) {
      await db.batch([
        db
          .update(appointments)
          .set({ ...appointmentUpdate, slotId: targetSlotId })
          .where(eq(appointments.id, appointmentId)),
        ...(shouldDeleteOldSlot && current.slotId !== targetSlotId
          ? [
              db
                .delete(availabilitySlots)
                .where(eq(availabilitySlots.id, current.slotId)),
            ]
          : []),
      ]);
    } else {
      await db.batch([
        db.insert(availabilitySlots).values({
          id: targetSlotId,
          teacherId: providerId,
          startsAt: range.startsAt,
          endsAt: range.endsAt,
        }),
        db
          .update(appointments)
          .set({ ...appointmentUpdate, slotId: targetSlotId })
          .where(eq(appointments.id, appointmentId)),
        ...(shouldDeleteOldSlot
          ? [
              db
                .delete(availabilitySlots)
                .where(eq(availabilitySlots.id, current.slotId)),
            ]
          : []),
      ]);
    }
  } catch (error) {
    if (isPostgresError(error, "23505")) {
      throw new ProviderAppointmentConflictError();
    }
    throw error;
  }

  return requireProviderAppointment(providerId, appointmentId);
}

async function requireProviderStudent(providerId: string, studentId: string) {
  const [student] = await db
    .select()
    .from(providerStudents)
    .where(
      and(
        eq(providerStudents.id, studentId),
        eq(providerStudents.providerId, providerId),
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
  const [row] = await db
    .select({
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
      status: appointments.status,
      comment: appointments.comment,
      examName: appointments.examName,
      schoolYear: appointments.schoolYear,
      createdByProvider: appointments.createdByProvider,
      rescheduleCount: appointments.rescheduleCount,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(availabilitySlots.id, appointments.slotId))
    .leftJoin(user, eq(user.id, appointments.studentId))
    .leftJoin(
      providerStudents,
      eq(providerStudents.id, appointments.providerStudentId),
    )
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(availabilitySlots.teacherId, providerId),
      ),
    )
    .limit(1);

  if (!row) throw new ProviderAppointmentNotFoundError();

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
  range: { startsAt: Date; endsAt: Date },
  excludedAppointmentId?: string,
) {
  const [overlap] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(availabilitySlots.id, appointments.slotId))
    .where(
      and(
        eq(availabilitySlots.teacherId, providerId),
        eq(appointments.status, "scheduled"),
        lt(availabilitySlots.startsAt, range.endsAt),
        gt(availabilitySlots.endsAt, range.startsAt),
        excludedAppointmentId
          ? ne(appointments.id, excludedAppointmentId)
          : undefined,
      ),
    )
    .limit(1);

  if (overlap) throw new ProviderAppointmentConflictError();
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
