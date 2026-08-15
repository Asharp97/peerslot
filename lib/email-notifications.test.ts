import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }));

import {
  emailLocaleFromRequest,
  notifyProviderOfBookingRequest,
  notifyStudentOfBookingDecision,
} from "./email-notifications";

const appointment = {
  appointmentId: "appointment-id",
  endsAt: new Date("2030-01-15T09:30:00.000Z"),
  locale: "en" as const,
  providerName: "Ceyda",
  startsAt: new Date("2030-01-15T09:00:00.000Z"),
  studentName: "Ada",
  timeZone: "Europe/Istanbul",
};

describe("email notifications", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    vi.stubEnv("BETTER_AUTH_URL", "https://peerslot.com");
  });

  it("notifies the provider once per booking request", async () => {
    sendEmailMock.mockResolvedValue({ id: "email-id" });

    await notifyProviderOfBookingRequest({
      ...appointment,
      providerEmail: "provider@example.com",
      studentEmail: "student@example.com",
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "provider@example.com",
        idempotencyKey: "booking-request/appointment-id",
      }),
    );
  });

  it("does not fail an accepted booking when delivery fails", async () => {
    sendEmailMock.mockRejectedValue(new Error("Resend unavailable"));

    await expect(
      notifyStudentOfBookingDecision({
        ...appointment,
        decision: "accept",
        studentEmail: "student@example.com",
      }),
    ).resolves.toBeNull();
  });

  it("uses Turkish only when it is the preferred request language", () => {
    expect(
      emailLocaleFromRequest(
        new Request("https://peerslot.com", {
          headers: { "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8" },
        }),
      ),
    ).toBe("tr");
    expect(emailLocaleFromRequest(new Request("https://peerslot.com"))).toBe(
      "en",
    );
  });
});
