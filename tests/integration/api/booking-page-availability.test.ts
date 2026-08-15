import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAvailableTimesForPublishedBookingPage } = vi.hoisted(() => ({
  getAvailableTimesForPublishedBookingPage: vi.fn(),
}));

vi.mock("@/lib/available-times", () => ({
  getAvailableTimesForPublishedBookingPage,
}));

import { GET } from "@/app/api/booking-pages/[slug]/availability/route";

const validSlug = "ABCDEFGH";
const startsAt = "2030-01-15T09:00:00.000Z";
const endsAt = "2030-01-15T12:00:00.000Z";

describe("public available-times API integration", () => {
  beforeEach(() => {
    getAvailableTimesForPublishedBookingPage.mockReset();
  });

  it("returns canonical and localized available times", async () => {
    getAvailableTimesForPublishedBookingPage.mockResolvedValue({
      timeZone: "Europe/Istanbul",
      availableTimes: [
        {
          startsAt: new Date("2030-01-15T10:00:00.000Z"),
          endsAt: new Date("2030-01-15T10:30:00.000Z"),
          localized: {
            en: "Tuesday, January 15, 2030 at 1:00 PM",
            tr: "15 Ocak 2030 Salı 13:00",
          },
        },
      ],
    });

    const response = await GET(request(), context(validSlug));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.availableTimes[0]).toMatchObject({
      startsAt: "2030-01-15T10:00:00.000Z",
      localized: { tr: "15 Ocak 2030 Salı 13:00" },
    });
    expect(getAvailableTimesForPublishedBookingPage).toHaveBeenCalledWith(
      validSlug,
      {
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
    );
  });

  it("rejects an invalid range before querying availability", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/booking-pages/${validSlug}/availability?startsAt=${endsAt}&endsAt=${startsAt}`,
      ),
      context(validSlug),
    );

    expect(response.status).toBe(400);
    expect(getAvailableTimesForPublishedBookingPage).not.toHaveBeenCalled();
  });

  it("rejects an availability range longer than 45 days", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/booking-pages/${validSlug}/availability?startsAt=2030-01-01T00%3A00%3A00Z&endsAt=2030-03-01T00%3A00%3A00Z`,
      ),
      context(validSlug),
    );

    expect(response.status).toBe(400);
    expect(getAvailableTimesForPublishedBookingPage).not.toHaveBeenCalled();
  });

  it("hides unavailable or unpublished booking pages", async () => {
    getAvailableTimesForPublishedBookingPage.mockResolvedValue(null);

    const response = await GET(request(), context(validSlug));

    expect(response.status).toBe(404);
  });
});

function request() {
  return new Request(
    `http://localhost/api/booking-pages/${validSlug}/availability?startsAt=${startsAt}&endsAt=${endsAt}`,
  );
}

function context(slug: string) {
  return { params: Promise.resolve({ slug }) };
}
