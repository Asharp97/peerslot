import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => {
  class PageNotFoundError extends Error {}
  class UnavailableError extends Error {}
  return {
    create: vi.fn(),
    getSession: vi.fn(),
    PageNotFoundError,
    UnavailableError,
  };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/lib/public-appointment-request", () => ({
  createPublicAppointmentRequest: mocks.create,
  PublicAppointmentRequestPageNotFoundError: mocks.PageNotFoundError,
  PublicAppointmentRequestUnavailableError: mocks.UnavailableError,
}));

vi.mock("@/lib/public-appointment-request-schema", async (importOriginal) =>
  importOriginal(),
);

import { createPublicAppointmentRequest } from "@/lib/public-appointment-request";

const slug = "ABCDEFGH";
const startsAt = "2030-01-15T09:00:00.000Z";

describe("public appointment request API integration", () => {
  beforeEach(() => vi.clearAllMocks());

  beforeEach(() => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "student-user-id",
        name: "Authenticated Ada",
        email: "auth@example.com",
      },
    });
  });

  it("creates a pending appointment request", async () => {
    vi.mocked(createPublicAppointmentRequest).mockResolvedValue({
      id: "appointment-id",
      status: "pending",
    } as Awaited<ReturnType<typeof createPublicAppointmentRequest>>);

    const response = await POST(request(), {
      params: Promise.resolve({ slug }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      appointment: { id: "appointment-id", status: "pending" },
    });
    expect(createPublicAppointmentRequest).toHaveBeenCalledWith(
      slug,
      {
        startsAt: new Date(startsAt),
        comment: "LGS preparation",
      },
      {
        studentId: "student-user-id",
        studentName: "Authenticated Ada",
        studentEmail: "auth@example.com",
      },
    );
  });

  it("requires an authenticated booking session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(request(), {
      params: Promise.resolve({ slug }),
    });

    expect(response.status).toBe(401);
    expect(createPublicAppointmentRequest).not.toHaveBeenCalled();
  });

  it("rejects cross-origin confirmation attempts", async () => {
    const response = await POST(
      new Request(`http://localhost/api/booking-pages/${slug}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example",
        },
        body: JSON.stringify({
          studentName: "Ada Student",
          studentEmail: "ada@example.com",
          startsAt,
        }),
      }),
      { params: Promise.resolve({ slug }) },
    );

    expect(response.status).toBe(403);
    expect(createPublicAppointmentRequest).not.toHaveBeenCalled();
  });

  it("returns a conflict when the selected time was just reserved", async () => {
    vi.mocked(createPublicAppointmentRequest).mockRejectedValue(
      new mocks.UnavailableError(),
    );

    const response = await POST(request(), {
      params: Promise.resolve({ slug }),
    });

    expect(response.status).toBe(409);
  });

  it("rejects invalid booking details", async () => {
    const response = await POST(
      new Request(`http://localhost/api/booking-pages/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: "not-a-timestamp" }),
      }),
      { params: Promise.resolve({ slug }) },
    );

    expect(response.status).toBe(400);
    expect(createPublicAppointmentRequest).not.toHaveBeenCalled();
  });
});

function request() {
  return new Request(
    `http://localhost/api/booking-pages/${slug}/appointments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
      },
      body: JSON.stringify({
        startsAt,
        comment: "LGS preparation",
      }),
    },
  );
}
