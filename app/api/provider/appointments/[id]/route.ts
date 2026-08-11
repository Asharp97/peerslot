import { NextResponse } from "next/server";
import { z } from "zod";

import { providerAppointmentErrorResponse } from "../error-response";

import {
  providerAppointmentDeleteSchema,
  providerAppointmentUpdateSchema,
} from "@/lib/provider-appointment";
import {
  deleteProviderAppointment,
  updateProviderAppointment,
} from "@/lib/provider-appointments";
import { getCurrentUser } from "@/lib/current-user";

const idSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const id = idSchema.safeParse((await context.params).id);
  const input = providerAppointmentUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!id.success || !input.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment update",
        issues: !id.success
          ? id.error.issues
          : !input.success
            ? input.error.issues
            : [],
      },
      { status: 400 },
    );
  }

  try {
    const appointment = await updateProviderAppointment(
      currentUser.user.id,
      id.data,
      input.data,
    );
    return NextResponse.json({ appointment });
  } catch (error) {
    return providerAppointmentErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const id = idSchema.safeParse((await context.params).id);
  const input = providerAppointmentDeleteSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!id.success || !input.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment deletion",
        issues: !id.success
          ? id.error.issues
          : !input.success
            ? input.error.issues
            : [],
      },
      { status: 400 },
    );
  }

  try {
    const result = await deleteProviderAppointment(
      currentUser.user.id,
      id.data,
      input.data,
    );
    return NextResponse.json(result);
  } catch (error) {
    return providerAppointmentErrorResponse(error);
  }
}
