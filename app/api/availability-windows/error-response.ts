import { NextResponse } from "next/server";

import {
  AvailabilityWindowConflictError,
  AvailabilityWindowNotFoundError,
  AvailabilityWindowValidationError,
} from "@/lib/availability-windows";

export function availabilityWindowErrorResponse(error: unknown) {
  if (error instanceof AvailabilityWindowValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof AvailabilityWindowNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof AvailabilityWindowConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  throw error;
}
