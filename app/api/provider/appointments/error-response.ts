import { NextResponse } from "next/server";

import {
  ProviderAppointmentConflictError,
  ProviderAppointmentNotFoundError,
  ProviderStudentNotFoundError,
} from "@/lib/provider-appointments";

export function providerAppointmentErrorResponse(error: unknown) {
  if (error instanceof ProviderAppointmentConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (
    error instanceof ProviderAppointmentNotFoundError ||
    error instanceof ProviderStudentNotFoundError
  ) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  throw error;
}
