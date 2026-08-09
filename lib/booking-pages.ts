import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { bookingPages, providerProfiles } from "@/db/schema";
import {
  type BookingPageSettingsInput,
  withBookingSlugRetries,
} from "@/lib/booking-page";

export { BookingSlugGenerationError } from "@/lib/booking-page";

export class BookingPageNotFoundError extends Error {
  constructor() {
    super("Booking page not found");
    this.name = "BookingPageNotFoundError";
  }
}

export async function findBookingPage(providerId: string) {
  const [bookingPage] = await db
    .select()
    .from(bookingPages)
    .where(eq(bookingPages.providerId, providerId))
    .limit(1);

  return bookingPage ?? null;
}

export async function updateBookingPage(
  providerId: string,
  settings: BookingPageSettingsInput,
) {
  const [bookingPage] = await db
    .update(bookingPages)
    .set({ ...settings, updatedAt: new Date() })
    .where(eq(bookingPages.providerId, providerId))
    .returning();

  if (!bookingPage) {
    throw new BookingPageNotFoundError();
  }

  return bookingPage;
}

export async function regenerateBookingPageSlug(providerId: string) {
  return withBookingSlugRetries(async (slug) => {
    const [bookingPage] = await db
      .update(bookingPages)
      .set({ slug, updatedAt: new Date() })
      .where(eq(bookingPages.providerId, providerId))
      .returning();

    if (!bookingPage) {
      throw new BookingPageNotFoundError();
    }

    return bookingPage;
  });
}

export async function findPublishedBookingPage(slug: string) {
  const [bookingPage] = await db
    .select({
      slug: bookingPages.slug,
      title: bookingPages.title,
      timeZone: bookingPages.timeZone,
      appointmentDurationMinutes: bookingPages.appointmentDurationMinutes,
      bookingIntervalMinutes: bookingPages.bookingIntervalMinutes,
      minimumNoticeHours: bookingPages.minimumNoticeHours,
      provider: {
        displayName: providerProfiles.displayName,
        professionalTitle: providerProfiles.professionalTitle,
      },
    })
    .from(bookingPages)
    .innerJoin(
      providerProfiles,
      eq(providerProfiles.userId, bookingPages.providerId),
    )
    .where(and(eq(bookingPages.slug, slug), eq(bookingPages.isPublished, true)))
    .limit(1);

  return bookingPage ?? null;
}
