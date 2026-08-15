import { describe, expect, it } from "vitest";

import {
  availabilityRulesOverlap,
  expandAvailabilityRule,
} from "@/lib/availability-recurrence";
import { formatInTimeZone } from "@/lib/availability-window";
import { zonedLocalDateTimeToUtc } from "@/lib/provider-availability";

describe("weekly availability recurrence", () => {
  it("expands weekly while preserving provider-local time through DST", () => {
    const timeZone = "Europe/Berlin";
    const occurrences = expandAvailabilityRule(
      {
        id: "rule-id",
        isActive: true,
        recurrence: "weekly",
        startsAt: zonedLocalDateTimeToUtc("2030-03-25", "09:00", timeZone),
        endsAt: zonedLocalDateTimeToUtc("2030-03-25", "12:00", timeZone),
      },
      {
        startsAt: new Date("2030-03-24T00:00:00.000Z"),
        endsAt: new Date("2030-04-10T00:00:00.000Z"),
      },
      timeZone,
    );

    expect(occurrences).toHaveLength(3);
    expect(
      occurrences.map(({ startsAt }) =>
        formatInTimeZone(startsAt, timeZone).slice(0, 16),
      ),
    ).toEqual(["2030-03-25T09:00", "2030-04-01T09:00", "2030-04-08T09:00"]);
  });

  it("detects weekly conflicts and allows separate weekly routines", () => {
    const mondayMorning = weeklyRule("2030-01-07T09:00:00.000Z", "10:00");

    expect(
      availabilityRulesOverlap(
        mondayMorning,
        weeklyRule("2030-01-14T09:30:00.000Z", "10:30"),
        "UTC",
      ),
    ).toBe(true);
    expect(
      availabilityRulesOverlap(
        mondayMorning,
        weeklyRule("2030-01-14T11:00:00.000Z", "12:00"),
        "UTC",
      ),
    ).toBe(false);
  });
});

function weeklyRule(startsAt: string, localEndTime: string) {
  const start = new Date(startsAt);
  const [hour, minute] = localEndTime.split(":").map(Number);
  const end = new Date(start);
  end.setUTCHours(hour, minute, 0, 0);

  return {
    startsAt: start,
    endsAt: end,
    recurrence: "weekly" as const,
  };
}
