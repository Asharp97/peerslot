import { NextResponse } from "next/server";

import { availabilityWindowCreateSchema } from "@/lib/availability-window";
import {
  createAvailabilityWindow,
  listAvailabilityWindows,
} from "@/lib/availability-windows";
import { getCurrentUser } from "@/lib/current-user";
import { availabilityWindowErrorResponse } from "@/app/api/availability-windows/error-response";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers have availability windows" },
      { status: 403 },
    );
  }

  try {
    const windows = await listAvailabilityWindows(currentUser.user.id);

    return NextResponse.json(
      { windows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return availabilityWindowErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers can create availability windows" },
      { status: 403 },
    );
  }

  const input = availabilityWindowCreateSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid availability window", issues: input.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await createAvailabilityWindow(
      currentUser.user.id,
      input.data,
    );

    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return availabilityWindowErrorResponse(error);
  }
}
