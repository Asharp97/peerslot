import { describe, expect, it } from "vitest";

import {
  bookingPageSettingsSchema,
  bookingSlugSchema,
  BookingSlugGenerationError,
  generateBookingSlug,
  withBookingSlugRetries,
} from "./booking-page";

describe("booking pages", () => {
  it("generates an eight-character slug from the public alphabet", () => {
    expect(generateBookingSlug(() => 0)).toBe("AAAAAAAA");
    expect(bookingSlugSchema.parse(generateBookingSlug())).toHaveLength(8);
  });

  it("rejects malformed and ambiguous slugs", () => {
    expect(bookingSlugSchema.safeParse("short").success).toBe(false);
    expect(bookingSlugSchema.safeParse("00000000").success).toBe(false);
    expect(bookingSlugSchema.safeParse("llllllll").success).toBe(false);
  });

  it("accepts publication and scheduling updates", () => {
    expect(
      bookingPageSettingsSchema.parse({
        title: "Book with Ceyda",
        timeZone: "Europe/Istanbul",
        appointmentDurationMinutes: 30,
        bookingIntervalMinutes: 15,
        minimumNoticeHours: 24,
        isPublished: false,
      }),
    ).toMatchObject({ isPublished: false, bookingIntervalMinutes: 15 });
  });

  it("rejects empty, unknown, or invalid updates", () => {
    expect(bookingPageSettingsSchema.safeParse({}).success).toBe(false);
    expect(bookingPageSettingsSchema.safeParse({ unknown: true }).success).toBe(
      false,
    );
    expect(
      bookingPageSettingsSchema.safeParse({ timeZone: "Not/AZone" }).success,
    ).toBe(false);
  });

  it("retries slug collisions and returns the first successful result", async () => {
    let attempts = 0;

    await expect(
      withBookingSlugRetries(
        async (slug) => {
          attempts += 1;
          if (attempts < 3) throw { code: "23505" };
          return slug;
        },
        () => "AAAAAAAA",
      ),
    ).resolves.toBe("AAAAAAAA");
    expect(attempts).toBe(3);
  });

  it("fails after the configured collision retry limit", async () => {
    await expect(
      withBookingSlugRetries(
        async () => {
          throw { code: "23505" };
        },
        () => "AAAAAAAA",
        2,
      ),
    ).rejects.toBeInstanceOf(BookingSlugGenerationError);
  });
});
