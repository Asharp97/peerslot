import { describe, expect, it, vi } from "vitest";

import { createAvailableTimeService } from "./available-time-service";
import type { AvailabilityBookingPage } from "./available-time";

describe("available-time service integration", () => {
  it("loads a booking-page range and returns fully filtered localized times", async () => {
    const range = {
      startsAt: new Date("2030-01-15T09:00:00.000Z"),
      endsAt: new Date("2030-01-15T12:00:00.000Z"),
    };
    const repository = {
      loadActiveWindows: vi.fn().mockResolvedValue([
        {
          id: "window-id",
          isActive: true,
          startsAt: new Date("2030-01-15T09:00:00.000Z"),
          endsAt: new Date("2030-01-15T12:00:00.000Z"),
        },
      ]),
      loadAppointments: vi.fn().mockResolvedValue([
        {
          status: "scheduled" as const,
          startsAt: new Date("2030-01-15T10:00:00.000Z"),
          endsAt: new Date("2030-01-15T10:30:00.000Z"),
        },
        {
          status: "cancelled" as const,
          startsAt: new Date("2030-01-15T11:00:00.000Z"),
          endsAt: new Date("2030-01-15T11:30:00.000Z"),
        },
      ]),
    };
    const service = createAvailableTimeService(
      repository,
      () => new Date("2030-01-15T08:30:00.000Z"),
    );
    const bookingPage: AvailabilityBookingPage = {
      id: "booking-page-id",
      timeZone: "Europe/Istanbul",
      appointmentDurationMinutes: 30,
      bookingIntervalMinutes: 30,
      minimumNoticeHours: 1,
    };

    const result = await service.calculate(bookingPage, range);

    expect(repository.loadActiveWindows).toHaveBeenCalledWith(
      "booking-page-id",
      range,
    );
    expect(repository.loadAppointments).toHaveBeenCalledWith(
      "booking-page-id",
      range,
    );
    expect(result.map(({ startsAt }) => startsAt.toISOString())).toEqual([
      "2030-01-15T09:30:00.000Z",
      "2030-01-15T10:30:00.000Z",
      "2030-01-15T11:00:00.000Z",
      "2030-01-15T11:30:00.000Z",
    ]);
    expect(result[0].localized.en).toContain("12:30 PM");
    expect(result[0].localized.tr).toContain("12:30");
  });
});
