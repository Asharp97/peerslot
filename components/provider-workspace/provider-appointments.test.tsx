// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      profile: { displayName: "Ada" },
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

    expect(
      screen.getByRole("heading", { name: "Ada’s sessions" }),
    ).toBeTruthy();

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

  it("deletes only the selected recurring occurrence from its edit dialog", async () => {
    const appointment = {
      id: "occurrence-id",
      appointmentId: "appointment-id",
      seriesId: "appointment-id",
      occurrenceStartsAt: "2030-01-15T09:00:00Z",
      recurrence: "weekly" as const,
      isException: false,
      providerStudentId: "student-id",
      studentName: "Ada",
      studentEmail: null,
      startsAt: "2030-01-15T09:00:00Z",
      endsAt: "2030-01-15T09:45:00Z",
      status: "scheduled" as const,
      comment: null,
      examName: "LGS",
      schoolYear: null,
      color: "#034f46",
      createdByProvider: true,
      rescheduleCount: 0,
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/provider/students")) {
        return Response.json({ students: [] });
      }
      if (url.includes("/api/provider/appointments/appointment-id")) {
        return Response.json({ deleted: true, scope: "occurrence" });
      }
      return Response.json({ appointments: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<ProviderAppointments copy={copy} />);

    await act(async () => {
      const clickEvent = calendar.props?.eventClick as (input: unknown) => void;
      clickEvent({ event: { extendedProps: { appointment } } });
    });
    fireEvent.click(
      screen.getByRole("button", { name: "deleteThisSession" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/provider/appointments/appointment-id",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({
            deleteScope: "occurrence",
            occurrenceStartsAt: "2030-01-15T09:00:00Z",
          }),
        }),
      );
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
  { title: "{name}’s sessions" },
  {
    get: (target, property) =>
      property in target
        ? target[property as keyof typeof target]
        : String(property),
  },
) as ProviderAppointmentsCopy;
