import { describe, expect, it } from "vitest";

import { groupBookingSlots } from "./booking-request-picker";

describe("booking slot presentation", () => {
  it("groups slots by local date and time of day", () => {
    const days = groupBookingSlots(
      [
        { startsAt: "2026-08-13T08:00:00.000Z" },
        { startsAt: "2026-08-13T10:00:00.000Z" },
        { startsAt: "2026-08-13T15:00:00.000Z" },
        { startsAt: "2026-08-14T08:00:00.000Z" },
      ],
      "tr",
      "Europe/Istanbul",
    );

    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      dateKey: "2026-08-13",
      day: "13",
      weekday: "Perşembe",
      monthYear: "Ağustos 2026",
    });
    expect(days[0].periods.map(({ period }) => period)).toEqual([
      "morning",
      "afternoon",
      "evening",
    ]);
    expect(days[0].periods.map(({ slots }) => slots[0].time)).toEqual([
      "11:00",
      "13:00",
      "18:00",
    ]);
  });

  it("uses the provider time zone instead of the browser time zone", () => {
    const [day] = groupBookingSlots(
      [{ startsAt: "2026-12-31T23:30:00.000Z" }],
      "en",
      "Europe/Istanbul",
    );

    expect(day).toMatchObject({
      dateKey: "2027-01-01",
      day: "1",
      weekday: "Friday",
      monthYear: "January 2027",
    });
    expect(day.periods[0]).toMatchObject({
      period: "morning",
      slots: [{ time: "02:30 AM" }],
    });
  });
});
