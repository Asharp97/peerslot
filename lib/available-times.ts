import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "@/db";
import {
  appointments,
  availabilitySlots,
  availabilityWindows,
  bookingPages,
} from "@/db/schema";
import { createAvailableTimeService } from "@/lib/available-time-service";
import type {
  AvailabilityBookingPage,
  AvailableTimeRange,
} from "@/lib/available-time";

const postgresAvailableTimeRepository = {
  async loadActiveWindows(bookingPageId: string, range: AvailableTimeRange) {
    return db
      .select({
        id: availabilityWindows.id,
        startsAt: availabilityWindows.startsAt,
        endsAt: availabilityWindows.endsAt,
        isActive: availabilityWindows.isActive,
      })
      .from(availabilityWindows)
      .where(
        and(
          eq(availabilityWindows.bookingPageId, bookingPageId),
          eq(availabilityWindows.isActive, true),
          lt(availabilityWindows.startsAt, range.endsAt),
          gt(availabilityWindows.endsAt, range.startsAt),
        ),
      );
  },

  async loadAppointments(bookingPageId: string, range: AvailableTimeRange) {
    return db
      .select({
        startsAt: availabilitySlots.startsAt,
        endsAt: availabilitySlots.endsAt,
        status: appointments.status,
      })
      .from(appointments)
      .innerJoin(
        availabilitySlots,
        eq(availabilitySlots.id, appointments.slotId),
      )
      .innerJoin(
        availabilityWindows,
        eq(availabilityWindows.id, availabilitySlots.availabilityWindowId),
      )
      .where(
        and(
          eq(availabilityWindows.bookingPageId, bookingPageId),
          lt(availabilitySlots.startsAt, range.endsAt),
          gt(availabilitySlots.endsAt, range.startsAt),
        ),
      );
  },
};

const availableTimeService = createAvailableTimeService(
  postgresAvailableTimeRepository,
);

export function getAvailableTimesForBookingPage(
  bookingPage: AvailabilityBookingPage,
  range: AvailableTimeRange,
) {
  return availableTimeService.calculate(bookingPage, range);
}

export async function findPublishedAvailabilityBookingPage(slug: string) {
  const [bookingPage] = await db
    .select({
      id: bookingPages.id,
      timeZone: bookingPages.timeZone,
      appointmentDurationMinutes: bookingPages.appointmentDurationMinutes,
      bookingIntervalMinutes: bookingPages.bookingIntervalMinutes,
      minimumNoticeHours: bookingPages.minimumNoticeHours,
    })
    .from(bookingPages)
    .where(and(eq(bookingPages.slug, slug), eq(bookingPages.isPublished, true)))
    .limit(1);

  return (bookingPage as AvailabilityBookingPage | undefined) ?? null;
}

export async function getAvailableTimesForPublishedBookingPage(
  slug: string,
  range: AvailableTimeRange,
) {
  const bookingPage = await findPublishedAvailabilityBookingPage(slug);

  if (!bookingPage) return null;

  return {
    timeZone: bookingPage.timeZone,
    availableTimes: await getAvailableTimesForBookingPage(bookingPage, range),
  };
}
