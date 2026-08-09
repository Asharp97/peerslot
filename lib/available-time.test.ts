import { describe, expect, it } from "vitest";

import {
  AvailableTimeConfigurationError,
  calculateAvailableTimes,
  localizeAvailableTime,
  type AvailabilityBookingPage,
} from "./available-time";

const bookingPage: AvailabilityBookingPage = {
  id: "booking-page-id",
  timeZone: "Europe/Istanbul",
  appointmentDurationMinutes: 30,
  bookingIntervalMinutes: 30,
  minimumNoticeHours: 1,
};

describe("available-time calculation", () => {
  it("derives ordered times and applies notice, status, and activity rules", () => {
    const availableTimes = calculateAvailableTimes({
      bookingPage,
      range: range("2030-01-15T08:00:00.000Z", "2030-01-15T14:00:00.000Z"),
      windows: [
        {
          id: "later-window",
          isActive: true,
          ...range("2030-01-15T12:00:00.000Z", "2030-01-15T13:00:00.000Z"),
        },
        {
          id: "main-window",
          isActive: true,
          ...range("2030-01-15T08:30:00.000Z", "2030-01-15T11:00:00.000Z"),
        },
        {
          id: "disabled-window",
          isActive: false,
          ...range("2030-01-15T11:00:00.000Z", "2030-01-15T12:00:00.000Z"),
        },
      ],
      appointments: [
        {
          status: "scheduled",
          ...range("2030-01-15T09:30:00.000Z", "2030-01-15T10:00:00.000Z"),
        },
        {
          status: "cancelled",
          ...range("2030-01-15T10:00:00.000Z", "2030-01-15T10:30:00.000Z"),
        },
      ],
      now: new Date("2030-01-15T08:00:00.000Z"),
    });

    expect(
      availableTimes.map(({ startsAt }) => startsAt.toISOString()),
    ).toEqual([
      "2030-01-15T09:00:00.000Z",
      "2030-01-15T10:00:00.000Z",
      "2030-01-15T10:30:00.000Z",
      "2030-01-15T12:00:00.000Z",
      "2030-01-15T12:30:00.000Z",
    ]);
  });

  it("keeps only times that fit completely in the requested range", () => {
    const availableTimes = calculateAvailableTimes({
      bookingPage: { ...bookingPage, minimumNoticeHours: 0 },
      range: range("2030-01-15T09:15:00.000Z", "2030-01-15T10:45:00.000Z"),
      windows: [
        {
          id: "window",
          isActive: true,
          ...range("2030-01-15T09:00:00.000Z", "2030-01-15T11:00:00.000Z"),
        },
      ],
      appointments: [],
      now: new Date("2030-01-15T08:00:00.000Z"),
    });

    expect(
      availableTimes.map(({ startsAt }) => startsAt.toISOString()),
    ).toEqual(["2030-01-15T09:30:00.000Z", "2030-01-15T10:00:00.000Z"]);
  });

  it("localizes a provider-time-zone date in English and Turkish", () => {
    const localized = localizeAvailableTime(
      new Date("2030-01-15T10:00:00.000Z"),
      "Europe/Istanbul",
    );

    expect(localized.en).toContain("Tuesday, January 15, 2030");
    expect(localized.en).toContain("1:00 PM");
    expect(localized.tr).toContain("15 Ocak 2030 Salı");
    expect(localized.tr).toContain("13:00");
  });

  it("requires duration to equal interval for non-overlapping MVP times", () => {
    expect(() =>
      calculateAvailableTimes({
        bookingPage: { ...bookingPage, bookingIntervalMinutes: 15 },
        range: range("2030-01-15T09:00:00.000Z", "2030-01-15T11:00:00.000Z"),
        windows: [],
        appointments: [],
        now: new Date("2030-01-15T08:00:00.000Z"),
      }),
    ).toThrow(AvailableTimeConfigurationError);
  });
});

function range(startsAt: string, endsAt: string) {
  return { startsAt: new Date(startsAt), endsAt: new Date(endsAt) };
}
