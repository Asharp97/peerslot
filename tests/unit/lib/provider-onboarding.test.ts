import { describe, expect, it } from "vitest";

import { providerOnboardingSchema } from "@/lib/provider-onboarding";
import { generateBookingSlug, isValidTimeZone } from "@/lib/booking-page";

describe("provider onboarding", () => {
  it("generates an eight-character booking slug", () => {
    expect(generateBookingSlug(() => 0)).toBe("AAAAAAAA");
    expect(generateBookingSlug(() => 1)).toHaveLength(8);
  });

  it("validates IANA time zones", () => {
    expect(isValidTimeZone("Europe/Istanbul")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
  });

  it("uses the supported scheduling settings, including ten-minute rest", () => {
    expect(
      providerOnboardingSchema.parse({
        displayName: "Ceyda",
        professionalTitle: "Counselor",
        timeZone: "Europe/Istanbul",
        defaultAppointmentDurationMinutes: 30,
        minimumBookingNoticeMinutes: 1440,
        restBetweenSessionsMinutes: 10,
      }),
    ).toMatchObject({
      displayName: "Ceyda",
      restBetweenSessionsMinutes: 10,
    });
  });

  it("accepts five-minute duration and rest steps through their limits", () => {
    expect(
      providerOnboardingSchema.safeParse({
        displayName: "Ceyda",
        professionalTitle: "Counselor",
        timeZone: "Europe/Istanbul",
        defaultAppointmentDurationMinutes: 10,
        minimumBookingNoticeMinutes: 1440,
        restBetweenSessionsMinutes: 60,
      }).success,
    ).toBe(true);
  });

  it("rejects unsupported duration, notice, and rest settings", () => {
    expect(
      providerOnboardingSchema.safeParse({
        displayName: "Ceyda",
        professionalTitle: "Counselor",
        timeZone: "Europe/Istanbul",
        defaultAppointmentDurationMinutes: 17,
        minimumBookingNoticeMinutes: 15,
        restBetweenSessionsMinutes: 11,
      }).success,
    ).toBe(false);
  });
});
