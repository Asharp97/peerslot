import { describe, expect, it } from "vitest";

import {
  availabilityWindowCreateSchema,
  availabilityWindowRemovalMode,
  availabilityWindowUpdateSchema,
  deriveAvailabilitySlots,
  formatInTimeZone,
} from "./availability-window";

describe("availability windows", () => {
  it("derives six 30-minute starts from a three-hour window", () => {
    let id = 0;
    const slots = deriveAvailabilitySlots(
      {
        startsAt: new Date("2030-01-15T10:00:00.000Z"),
        endsAt: new Date("2030-01-15T13:00:00.000Z"),
      },
      30,
      30,
      () => `slot-${(id += 1)}`,
    );

    expect(slots).toHaveLength(6);
    expect(slots.map(({ startsAt }) => startsAt.toISOString())).toEqual([
      "2030-01-15T10:00:00.000Z",
      "2030-01-15T10:30:00.000Z",
      "2030-01-15T11:00:00.000Z",
      "2030-01-15T11:30:00.000Z",
      "2030-01-15T12:00:00.000Z",
      "2030-01-15T12:30:00.000Z",
    ]);
  });

  it("requires offset-aware timestamps and an end after the start", () => {
    expect(
      availabilityWindowCreateSchema.safeParse({
        startsAt: "2030-01-15T13:00:00+03:00",
        endsAt: "2030-01-15T16:00:00+03:00",
      }).success,
    ).toBe(true);
    expect(
      availabilityWindowCreateSchema.parse({
        startsAt: "2030-01-15T13:00:00+03:00",
        endsAt: "2030-01-15T16:00:00+03:00",
      }).recurrence,
    ).toBe("weekly");
    expect(
      availabilityWindowCreateSchema.safeParse({
        startsAt: "2030-01-15T13:00:00",
        endsAt: "2030-01-15T16:00:00",
      }).success,
    ).toBe(false);
    expect(
      availabilityWindowCreateSchema.safeParse({
        startsAt: "2030-01-15T16:00:00+03:00",
        endsAt: "2030-01-15T13:00:00+03:00",
      }).success,
    ).toBe(false);
  });

  it("requires start and end to be edited together", () => {
    expect(
      availabilityWindowUpdateSchema.safeParse({
        startsAt: "2030-01-15T13:00:00+03:00",
      }).success,
    ).toBe(false);
    expect(
      availabilityWindowUpdateSchema.safeParse({
        isActive: false,
        recurrence: "none",
      }).success,
    ).toBe(true);
  });

  it("presents UTC timestamps in the provider time zone", () => {
    expect(
      formatInTimeZone(new Date("2030-01-15T10:00:00.000Z"), "Europe/Istanbul"),
    ).toBe("2030-01-15T13:00:00");
  });

  it("rejects invalid slot-generation settings", () => {
    expect(() =>
      deriveAvailabilitySlots(
        {
          startsAt: new Date("2030-01-15T10:00:00.000Z"),
          endsAt: new Date("2030-01-15T13:00:00.000Z"),
        },
        30,
        0,
        () => "slot-id",
      ),
    ).toThrow("Slot duration and interval must be positive numbers");
  });

  it("preserves a window when an appointment depends on it", () => {
    expect(availabilityWindowRemovalMode(true)).toBe("preserve");
    expect(availabilityWindowRemovalMode(false)).toBe("delete");
  });
});
