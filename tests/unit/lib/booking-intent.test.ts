import { describe, expect, it } from "vitest";

import {
  bookingIntentLifetimeSeconds,
  createBookingIntent,
  readBookingIntent,
  signBookingIntent,
} from "@/lib/booking-intent";

const secret = "a-test-secret-that-is-long-enough-for-hmac";
const now = new Date("2030-01-01T00:00:00.000Z").getTime();

describe("booking intent", () => {
  it("round-trips a signed intent for ten minutes", () => {
    const intent = createBookingIntent(
      {
        bookingPageId: "33ead7c8-d327-4e79-9624-f405a834f14f",
        selectedStartTime: "2030-01-15T09:00:00.000Z",
        selectedEndTime: "2030-01-15T09:30:00.000Z",
        locale: "en",
      },
      now,
    );

    expect(
      readBookingIntent(signBookingIntent(intent, secret), secret, now),
    ).toEqual(intent);
    expect(intent.expiresAt).toBe(now + bookingIntentLifetimeSeconds * 1000);
  });

  it("rejects tampered and expired values", () => {
    const intent = createBookingIntent(
      {
        bookingPageId: "33ead7c8-d327-4e79-9624-f405a834f14f",
        selectedStartTime: "2030-01-15T09:00:00.000Z",
        selectedEndTime: "2030-01-15T09:30:00.000Z",
        locale: "tr",
      },
      now,
    );
    const signed = signBookingIntent(intent, secret);

    expect(readBookingIntent(`${signed}x`, secret, now)).toBeNull();
    expect(readBookingIntent(signed, secret, intent.expiresAt)).toBeNull();
  });
});
