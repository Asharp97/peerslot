import "dotenv/config";

import {
  bookingDecisionTemplate,
  newBookingRequestTemplate,
  verifyEmailTemplate,
} from "../lib/email-templates";
import { sendEmail } from "../lib/email";

const recipient = "ali-hisham@hotmail.com";
const sender = "PeerSlot <notifications@peerslot.com>";
const previewRun = "2026-08-15-v1";
const appointment = {
  endsAt: new Date("2026-08-20T09:30:00.000Z"),
  locale: "en" as const,
  providerName: "Dr. Ceyda Yılmaz",
  startsAt: new Date("2026-08-20T09:00:00.000Z"),
  studentName: "Sena Demir",
  timeZone: "Europe/Istanbul",
};

async function main() {
  const previews = [
    {
      key: "new-booking-request",
      template: newBookingRequestTemplate({
        ...appointment,
        comment: "I would like to discuss my study plan before the new term.",
        reviewUrl: "https://peerslot.com/en/provider/requests",
        studentEmail: "sena.demir@example.com",
      }),
    },
    {
      key: "booking-accepted",
      template: bookingDecisionTemplate({
        ...appointment,
        decision: "accept",
        viewUrl: "https://peerslot.com/en",
      }),
    },
    {
      key: "booking-declined",
      template: bookingDecisionTemplate({
        ...appointment,
        decision: "decline",
        viewUrl: "https://peerslot.com/en/book/PREVIEW1",
      }),
    },
    {
      key: "email-verification",
      template: verifyEmailTemplate({
        locale: "en",
        name: "Sena Demir",
        verificationUrl: "https://peerslot.com/en?email-preview=verified",
      }),
    },
  ];

  for (const preview of previews) {
    const result = await sendEmail({
      ...preview.template,
      from: sender,
      idempotencyKey: `email-preview/${previewRun}/${preview.key}`,
      subject: `[Preview] ${preview.template.subject}`,
      to: recipient,
    });
    console.log(`${preview.key}: ${result.id}`);
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Preview send failed");
  process.exitCode = 1;
});
