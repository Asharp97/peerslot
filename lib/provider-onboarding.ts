import { randomInt } from "node:crypto";

import { z } from "zod";

const slugAlphabet =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export const appointmentDurationOptions = [15, 30, 45, 60, 90] as const;
export const bookingNoticeOptions = [0, 60, 240, 720, 1440, 2880] as const;
export const restTimeOptions = [0, 5, 10, 15, 20, 30] as const;

export const providerOnboardingSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  professionalTitle: z.string().trim().min(2).max(80),
  timeZone: z.string().trim().refine(isValidTimeZone, "Invalid time zone"),
  defaultAppointmentDurationMinutes: z
    .number()
    .int()
    .refine(
      (value) =>
        (appointmentDurationOptions as readonly number[]).includes(value),
      "Invalid appointment duration",
    ),
  minimumBookingNoticeMinutes: z
    .number()
    .int()
    .refine(
      (value) => (bookingNoticeOptions as readonly number[]).includes(value),
      "Invalid minimum booking notice",
    ),
  restBetweenSessionsMinutes: z
    .number()
    .int()
    .refine(
      (value) => (restTimeOptions as readonly number[]).includes(value),
      "Invalid rest time",
    ),
});

export type ProviderOnboardingInput = z.infer<typeof providerOnboardingSchema>;

export function generateBookingSlug(
  pickIndex: (maximum: number) => number = randomInt,
) {
  return Array.from(
    { length: 8 },
    () => slugAlphabet[pickIndex(slugAlphabet.length)],
  ).join("");
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}
