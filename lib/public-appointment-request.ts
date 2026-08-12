import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { bookingPages, providerProfiles } from "@/db/schema";
import { getAvailableTimesForBookingPage } from "@/lib/available-times";
import {
  createPendingProviderAppointment,
  createProviderStudent,
  ProviderAppointmentConflictError,
} from "@/lib/provider-appointments";
import type { PublicAppointmentRequestInput } from "@/lib/public-appointment-request-schema";

export class PublicAppointmentRequestUnavailableError extends Error {
  constructor() {
    super("This appointment time is no longer available");
    this.name = "PublicAppointmentRequestUnavailableError";
  }
}

export class PublicAppointmentRequestPageNotFoundError extends Error {
  constructor() {
    super("Booking page not found");
    this.name = "PublicAppointmentRequestPageNotFoundError";
  }
}

export async function createPublicAppointmentRequest(
  slug: string,
  input: PublicAppointmentRequestInput,
) {
  const [page] = await db
    .select({
      id: bookingPages.id,
      providerId: bookingPages.providerId,
      timeZone: bookingPages.timeZone,
      appointmentDurationMinutes: bookingPages.appointmentDurationMinutes,
      bookingIntervalMinutes: bookingPages.bookingIntervalMinutes,
      restBetweenSessionsMinutes: providerProfiles.restBetweenSessionsMinutes,
      minimumNoticeHours: bookingPages.minimumNoticeHours,
    })
    .from(bookingPages)
    .innerJoin(
      providerProfiles,
      eq(providerProfiles.userId, bookingPages.providerId),
    )
    .where(and(eq(bookingPages.slug, slug), eq(bookingPages.isPublished, true)))
    .limit(1);

  if (!page) throw new PublicAppointmentRequestPageNotFoundError();

  const endsAt = new Date(
    input.startsAt.getTime() + page.appointmentDurationMinutes * 60_000,
  );
  const availableTimes = await getAvailableTimesForBookingPage(page, {
    startsAt: input.startsAt,
    endsAt,
  });

  if (
    !availableTimes.some(
      ({ startsAt }) => startsAt.getTime() === input.startsAt.getTime(),
    )
  ) {
    throw new PublicAppointmentRequestUnavailableError();
  }

  const student = await createProviderStudent(page.providerId, {
    displayName: input.studentName,
    email: input.studentEmail,
  });

  try {
    return await createPendingProviderAppointment(page.providerId, {
      providerStudentId: student.id,
      startsAt: input.startsAt,
      endsAt,
      comment: input.comment,
    });
  } catch (error) {
    if (error instanceof ProviderAppointmentConflictError) {
      throw new PublicAppointmentRequestUnavailableError();
    }
    throw error;
  }
}
