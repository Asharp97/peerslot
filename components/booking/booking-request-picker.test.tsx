// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BookingRequestPicker,
  type BookingRequestCopy,
  groupBookingSlots,
} from "./booking-request-picker";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

describe("booking authentication", () => {
  it("shows authentication before an unauthenticated request can be confirmed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BookingRequestPicker
        bookingPageId="33ead7c8-d327-4e79-9624-f405a834f14f"
        bookingTitle="Counseling session"
        copy={copy}
        locale="en"
        slug="ABCDEFGH"
        slots={[{ startsAt: "2030-01-15T09:00:00.000Z" }]}
        timeZone="Europe/Istanbul"
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Tuesday, January 15, 2030 at 12:00 PM/,
      }),
    );

    fireEvent.change(screen.getByLabelText(copy.name), {
      target: { value: "Ada Student" },
    });
    fireEvent.change(screen.getByLabelText(copy.email), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: copy.continue }));

    expect(
      await screen.findByRole("heading", { name: copy.authTitle }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: copy.googleAction }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: copy.microsoftAction }),
    ).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/appointments"),
      ),
    ).toBe(false);
  });
});

const copy = new Proxy(
  {},
  { get: (_target, property) => String(property) },
) as BookingRequestCopy;
