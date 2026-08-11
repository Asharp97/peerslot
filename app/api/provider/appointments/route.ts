import { NextResponse } from "next/server";

import { providerAppointmentErrorResponse } from "./error-response";

import {
  providerAppointmentCreateSchema,
  providerAppointmentRangeSchema,
} from "@/lib/provider-appointment";
import {
  createProviderAppointment,
  listProviderAppointments,
} from "@/lib/provider-appointments";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Provider setup required" },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const range = providerAppointmentRangeSchema.safeParse({
    startsAt: url.searchParams.get("startsAt"),
    endsAt: url.searchParams.get("endsAt"),
  });

  if (!range.success) {
    return NextResponse.json(
      { error: "Invalid appointment range", issues: range.error.issues },
      { status: 400 },
    );
  }

  const appointments = await listProviderAppointments(
    currentUser.user.id,
    range.data,
  );

  return NextResponse.json(
    { appointments },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Provider setup required" },
      { status: 403 },
    );
  }

  const input = providerAppointmentCreateSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid appointment", issues: input.error.issues },
      { status: 400 },
    );
  }

  try {
    const appointment = await createProviderAppointment(
      currentUser.user.id,
      input.data,
    );
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return providerAppointmentErrorResponse(error);
  }
}
