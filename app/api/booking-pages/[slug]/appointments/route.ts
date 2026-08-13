import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { bookingIntentCookieName } from "@/lib/booking-intent";
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
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      {
        ...input.data,
        studentName: session.user.name,
        studentEmail: session.user.email,
      },
    );
    const response = NextResponse.json(
      { appointment: { id: appointment.id, status: appointment.status } },
      { status: 201 },
    );
    response.cookies.set({
      name: bookingIntentCookieName,
      value: "",
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
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
