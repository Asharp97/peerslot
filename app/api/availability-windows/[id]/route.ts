import { NextResponse } from "next/server";
import { z } from "zod";

import { availabilityWindowUpdateSchema } from "@/lib/availability-window";
import {
  AvailabilityWindowHasAppointmentsError,
  removeAvailabilityWindow,
  updateAvailabilityWindow,
} from "@/lib/availability-windows";
import { getCurrentUser } from "@/lib/current-user";
import { availabilityWindowErrorResponse } from "@/app/api/availability-windows/error-response";

const idSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers can update availability windows" },
      { status: 403 },
    );
  }

  const id = idSchema.safeParse((await context.params).id);
  const input = availabilityWindowUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!id.success) {
    return NextResponse.json(
      {
        error: "Invalid availability window id",
        issues: id.error.issues,
      },
      { status: 400 },
    );
  }

  if (!input.success) {
    return NextResponse.json(
      {
        error: "Invalid availability window update",
        issues: input.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const result = await updateAvailabilityWindow(
      id.data,
      currentUser.user.id,
      input.data,
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AvailabilityWindowHasAppointmentsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return availabilityWindowErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers can remove availability windows" },
      { status: 403 },
    );
  }

  const id = idSchema.safeParse((await context.params).id);

  if (!id.success) {
    return NextResponse.json(
      { error: "Invalid availability window id", issues: id.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await removeAvailabilityWindow(id.data, currentUser.user.id);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return availabilityWindowErrorResponse(error);
  }
}
