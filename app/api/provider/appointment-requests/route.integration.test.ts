import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";
import { PATCH } from "./[id]/route";

import { getCurrentUser } from "@/lib/current-user";
import {
  listPendingProviderAppointments,
  reviewProviderAppointment,
} from "@/lib/provider-appointments";

vi.mock("@/lib/current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/provider-appointments", () => ({
  ProviderAppointmentConflictError: class extends Error {},
  ProviderAppointmentNotFoundError: class extends Error {},
  ProviderAppointmentReviewConflictError: class extends Error {},
  ProviderAppointmentValidationError: class extends Error {},
  ProviderStudentNotFoundError: class extends Error {},
  listPendingProviderAppointments: vi.fn(),
  reviewProviderAppointment: vi.fn(),
}));

const providerId = "provider-id";
const appointmentId = "550e8400-e29b-41d4-a716-446655440000";

describe("provider appointment requests API integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      user: { id: providerId },
      capabilities: { canProvide: true },
    } as Awaited<ReturnType<typeof getCurrentUser>>);
  });

  it("lists only the provider's pending requests without caching", async () => {
    vi.mocked(listPendingProviderAppointments).mockResolvedValue([
      { id: appointmentId, status: "pending" },
    ] as Awaited<ReturnType<typeof listPendingProviderAppointments>>);

    const response = await GET(
      new Request("http://localhost/api/provider/appointment-requests"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(listPendingProviderAppointments).toHaveBeenCalledWith(providerId);
  });

  it.each(["accept", "decline"] as const)(
    "%ss a pending request",
    async (decision) => {
      vi.mocked(reviewProviderAppointment).mockResolvedValue({
        id: appointmentId,
        status: decision === "accept" ? "scheduled" : "declined",
      } as Awaited<ReturnType<typeof reviewProviderAppointment>>);

      const response = await PATCH(
        jsonRequest(
          `http://localhost/api/provider/appointment-requests/${appointmentId}`,
          { decision },
        ),
        { params: Promise.resolve({ id: appointmentId }) },
      );

      expect(response.status).toBe(200);
      expect(reviewProviderAppointment).toHaveBeenCalledWith(
        providerId,
        appointmentId,
        decision,
      );
    },
  );

  it("rejects an unsupported review decision", async () => {
    const response = await PATCH(
      jsonRequest(
        `http://localhost/api/provider/appointment-requests/${appointmentId}`,
        { decision: "maybe" },
      ),
      { params: Promise.resolve({ id: appointmentId }) },
    );

    expect(response.status).toBe(400);
    expect(reviewProviderAppointment).not.toHaveBeenCalled();
  });
});

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
