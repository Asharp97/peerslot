// @vitest-environment jsdom

import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ProviderAppointments,
  readableTextColor,
  type ProviderAppointmentsCopy,
} from "./provider-appointments";

const calendar = vi.hoisted(() => ({
  props: null as Record<string, unknown> | null,
}));

vi.mock("@fullcalendar/react", () => ({
  default: (props: Record<string, unknown>) => {
    calendar.props = props;
    return null;
  },
}));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("./provider-shell", () => ({
  useProviderWorkspace: () => ({
    accessToken: "access-token",
    data: {
      bookingPage: {
        timeZone: "Europe/Istanbul",
        appointmentDurationMinutes: 45,
      },
    },
    refresh: vi.fn(),
  }),
}));

describe("provider appointments calendar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    calendar.props = null;
  });

  it("loads the visible range through an event source without a datesSet state loop", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return Response.json(
        url.includes("/api/provider/students")
          ? { students: [] }
          : {
              appointments: [
                {
                  id: "occurrence-id",
                  appointmentId: "appointment-id",
                  seriesId: "appointment-id",
                  occurrenceStartsAt: "2030-01-15T09:00:00Z",
                  recurrence: "weekly",
                  isException: false,
                  providerStudentId: "student-id",
                  studentName: "Ada",
                  studentEmail: null,
                  startsAt: "2030-01-15T09:00:00Z",
                  endsAt: "2030-01-15T09:45:00Z",
                  status: "scheduled",
                  comment: null,
                  examName: "LGS",
                  schoolYear: null,
                  color: "#034f46",
                  createdByProvider: true,
                  rescheduleCount: 0,
                },
              ],
            },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProviderAppointments copy={copy} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/provider/students",
        expect.any(Object),
      );
    });
    expect(calendar.props?.datesSet).toBeUndefined();
    expect(calendar.props?.events).toBeTypeOf("function");

    let events: unknown[] = [];
    await act(async () => {
      const loadEvents = calendar.props?.events as (range: {
        start: Date;
        end: Date;
      }) => Promise<unknown[]>;
      events = await loadEvents({
        start: new Date("2030-01-14T00:00:00Z"),
        end: new Date("2030-01-21T00:00:00Z"),
      });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/provider/appointments?startsAt="),
      expect.any(Object),
    );
    expect(events[0]).toMatchObject({
      backgroundColor: "#034f46",
      borderColor: "#ffffff",
      textColor: "#ffffff",
      extendedProps: { recurrenceLabel: "everyWeek" },
    });
  });
});

describe("session color contrast", () => {
  it("uses dark text on light colors and white text on dark colors", () => {
    expect(readableTextColor("#f0d7ff")).toBe("#1a1a1a");
    expect(readableTextColor("#034f46")).toBe("#ffffff");
  });
});

const copy = new Proxy(
  {},
  { get: (_target, property) => String(property) },
) as ProviderAppointmentsCopy;
