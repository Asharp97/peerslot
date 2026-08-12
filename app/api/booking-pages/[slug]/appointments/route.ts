import { NextResponse } from "next/server";

import {
  createPublicAppointmentRequest,
  PublicAppointmentRequestPageNotFoundError,
  PublicAppointmentRequestUnavailableError,
} from "@/lib/public-appointment-request";
import { publicAppointmentRequestSchema } from "@/lib/public-appointment-request-schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const input = publicAppointmentRequestSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid appointment request", issues: input.error.issues },
      { status: 400 },
    );
  }

  try {
    const appointment = await createPublicAppointmentRequest(
      (await context.params).slug,
      input.data,
    );
    return NextResponse.json(
      { appointment: { id: appointment.id, status: appointment.status } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PublicAppointmentRequestPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof PublicAppointmentRequestUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
