import { randomUUID } from "node:crypto";

import { and, asc, eq, gt, lt, ne, notExists } from "drizzle-orm";

import { db } from "@/db";
import {
  appointments,
  availabilitySlots,
  availabilityWindows,
} from "@/db/schema";
import {
  availabilityWindowRemovalMode,
  deriveAvailabilitySlots,
  formatInTimeZone,
  type AvailabilityWindowRange,
} from "@/lib/availability-window";
import { findBookingPage } from "@/lib/booking-pages";
import { isPostgresError } from "@/lib/database-errors";

type AvailabilityWindowUpdate = {
  startsAt?: Date;
  endsAt?: Date;
  isActive?: boolean;
};

export class AvailabilityWindowNotFoundError extends Error {
  constructor() {
    super("Availability window not found");
    this.name = "AvailabilityWindowNotFoundError";
  }
}

export class AvailabilityWindowConflictError extends Error {
  constructor() {
    super("Availability window overlaps another active window");
    this.name = "AvailabilityWindowConflictError";
  }
}

export class AvailabilityWindowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityWindowValidationError";
  }
}

export class AvailabilityWindowHasAppointmentsError extends Error {
  constructor() {
    super("Availability with existing appointments cannot change times");
    this.name = "AvailabilityWindowHasAppointmentsError";
  }
}

export async function listAvailabilityWindows(providerId: string) {
  const bookingPage = await requireBookingPage(providerId);
  const windows = await db
    .select()
    .from(availabilityWindows)
    .where(eq(availabilityWindows.bookingPageId, bookingPage.id))
    .orderBy(asc(availabilityWindows.startsAt));

  return windows.map((window) =>
    presentAvailabilityWindow(window, bookingPage.timeZone),
  );
}

export async function createAvailabilityWindow(
  providerId: string,
  range: AvailabilityWindowRange,
) {
  const bookingPage = await requireBookingPage(providerId);
  validateFutureRange(range);
  await assertNoActiveOverlap(bookingPage.id, range);

  const windowId = randomUUID();
  const slots = deriveSlots(range, bookingPage);

  try {
    await db.batch([
      db.insert(availabilityWindows).values({
        id: windowId,
        bookingPageId: bookingPage.id,
        startsAt: range.startsAt,
        endsAt: range.endsAt,
      }),
      db.insert(availabilitySlots).values(
        slots.map((slot) => ({
          ...slot,
          teacherId: providerId,
          availabilityWindowId: windowId,
        })),
      ),
    ]);
  } catch (error) {
    throwAvailabilityConflict(error);
  }

  return getAvailabilityWindowResult(windowId, providerId);
}

export async function updateAvailabilityWindow(
  windowId: string,
  providerId: string,
  input: AvailabilityWindowUpdate,
) {
  const current = await requireOwnedAvailabilityWindow(windowId, providerId);
  const range = {
    startsAt: input.startsAt ?? current.window.startsAt,
    endsAt: input.endsAt ?? current.window.endsAt,
  };
  const timesChanged = input.startsAt !== undefined;
  const isActive = input.isActive ?? current.window.isActive;

  if (isActive || timesChanged) {
    validateFutureRange(range);
  }

  if (isActive) {
    await assertNoActiveOverlap(current.bookingPage.id, range, windowId);
  }

  if (timesChanged && (await windowHasAppointments(windowId))) {
    throw new AvailabilityWindowHasAppointmentsError();
  }

  const updateQuery = db
    .update(availabilityWindows)
    .set({
      ...(timesChanged ? range : {}),
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(availabilityWindows.id, windowId));

  try {
    if (!isActive) {
      await db.batch([updateQuery, deleteUnbookedWindowSlots(windowId)]);
    } else if (timesChanged) {
      const slots = deriveSlots(range, current.bookingPage);
      await db.batch([
        db
          .delete(availabilitySlots)
          .where(eq(availabilitySlots.availabilityWindowId, windowId)),
        updateQuery,
        db.insert(availabilitySlots).values(
          slots.map((slot) => ({
            ...slot,
            teacherId: providerId,
            availabilityWindowId: windowId,
          })),
        ),
      ]);
    } else if (!current.window.isActive) {
      const slots = deriveSlots(range, current.bookingPage);
      await db.batch([
        updateQuery,
        db
          .insert(availabilitySlots)
          .values(
            slots.map((slot) => ({
              ...slot,
              teacherId: providerId,
              availabilityWindowId: windowId,
            })),
          )
          .onConflictDoNothing(),
      ]);
    } else {
      await updateQuery;
    }
  } catch (error) {
    throwAvailabilityConflict(error);
  }

  return getAvailabilityWindowResult(windowId, providerId);
}

export async function removeAvailabilityWindow(
  windowId: string,
  providerId: string,
) {
  const current = await requireOwnedAvailabilityWindow(windowId, providerId);

  if (current.window.startsAt <= new Date()) {
    throw new AvailabilityWindowValidationError(
      "Only future availability windows can be removed",
    );
  }

  if (
    availabilityWindowRemovalMode(await windowHasAppointments(windowId)) ===
    "preserve"
  ) {
    await preserveBookedWindow(windowId);
    return {
      deleted: false,
      preservedForAppointments: true,
      window: presentAvailabilityWindow(
        { ...current.window, isActive: false, updatedAt: new Date() },
        current.bookingPage.timeZone,
      ),
    };
  }

  try {
    await db
      .delete(availabilityWindows)
      .where(eq(availabilityWindows.id, windowId));

    return { deleted: true, preservedForAppointments: false, window: null };
  } catch (error) {
    if (!isPostgresError(error, "23503")) {
      throw error;
    }

    await preserveBookedWindow(windowId);
    return {
      deleted: false,
      preservedForAppointments: true,
      window: presentAvailabilityWindow(
        { ...current.window, isActive: false, updatedAt: new Date() },
        current.bookingPage.timeZone,
      ),
    };
  }
}

async function requireBookingPage(providerId: string) {
  const bookingPage = await findBookingPage(providerId);

  if (!bookingPage) {
    throw new AvailabilityWindowNotFoundError();
  }

  return bookingPage;
}

async function requireOwnedAvailabilityWindow(
  windowId: string,
  providerId: string,
) {
  const bookingPage = await requireBookingPage(providerId);
  const [window] = await db
    .select()
    .from(availabilityWindows)
    .where(
      and(
        eq(availabilityWindows.id, windowId),
        eq(availabilityWindows.bookingPageId, bookingPage.id),
      ),
    )
    .limit(1);

  if (!window) {
    throw new AvailabilityWindowNotFoundError();
  }

  return { bookingPage, window };
}

async function assertNoActiveOverlap(
  bookingPageId: string,
  range: AvailabilityWindowRange,
  excludedWindowId?: string,
) {
  const [overlap] = await db
    .select({ id: availabilityWindows.id })
    .from(availabilityWindows)
    .where(
      and(
        eq(availabilityWindows.bookingPageId, bookingPageId),
        eq(availabilityWindows.isActive, true),
        lt(availabilityWindows.startsAt, range.endsAt),
        gt(availabilityWindows.endsAt, range.startsAt),
        excludedWindowId
          ? ne(availabilityWindows.id, excludedWindowId)
          : undefined,
      ),
    )
    .limit(1);

  if (overlap) {
    throw new AvailabilityWindowConflictError();
  }
}

function validateFutureRange(range: AvailabilityWindowRange) {
  if (range.endsAt <= range.startsAt) {
    throw new AvailabilityWindowValidationError(
      "endsAt must be after startsAt",
    );
  }

  if (range.startsAt <= new Date()) {
    throw new AvailabilityWindowValidationError(
      "startsAt must be in the future",
    );
  }
}

function deriveSlots(
  range: AvailabilityWindowRange,
  bookingPage: {
    appointmentDurationMinutes: number;
    bookingIntervalMinutes: number;
  },
) {
  let slots;

  try {
    slots = deriveAvailabilitySlots(
      range,
      bookingPage.appointmentDurationMinutes,
      bookingPage.bookingIntervalMinutes,
      randomUUID,
    );
  } catch (error) {
    if (error instanceof RangeError) {
      throw new AvailabilityWindowValidationError(error.message);
    }
    throw error;
  }

  if (slots.length === 0) {
    throw new AvailabilityWindowValidationError(
      "Availability window must fit at least one appointment",
    );
  }

  return slots;
}

async function getAvailabilityWindowResult(
  windowId: string,
  providerId: string,
) {
  const current = await requireOwnedAvailabilityWindow(windowId, providerId);
  const slots = await db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
    })
    .from(availabilitySlots)
    .where(eq(availabilitySlots.availabilityWindowId, windowId))
    .orderBy(asc(availabilitySlots.startsAt));

  return {
    window: presentAvailabilityWindow(
      current.window,
      current.bookingPage.timeZone,
    ),
    slots,
  };
}

async function windowHasAppointments(windowId: string) {
  const [appointment] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(availabilitySlots.id, appointments.slotId))
    .where(eq(availabilitySlots.availabilityWindowId, windowId))
    .limit(1);

  return appointment !== undefined;
}

function deleteUnbookedWindowSlots(windowId: string) {
  return db
    .delete(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.availabilityWindowId, windowId),
        notExists(
          db
            .select({ id: appointments.id })
            .from(appointments)
            .where(eq(appointments.slotId, availabilitySlots.id)),
        ),
      ),
    );
}

async function preserveBookedWindow(windowId: string) {
  await db.batch([
    db
      .update(availabilityWindows)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(availabilityWindows.id, windowId)),
    deleteUnbookedWindowSlots(windowId),
  ]);
}

function presentAvailabilityWindow(
  window: typeof availabilityWindows.$inferSelect,
  timeZone: string,
) {
  return {
    ...window,
    timeZone,
    localStartsAt: formatInTimeZone(window.startsAt, timeZone),
    localEndsAt: formatInTimeZone(window.endsAt, timeZone),
  };
}

function throwAvailabilityConflict(error: unknown): never {
  if (isPostgresError(error, "23P01") || isPostgresError(error, "23505")) {
    throw new AvailabilityWindowConflictError();
  }

  throw error;
}
