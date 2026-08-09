import { NextResponse } from "next/server";

import { bookingPageSettingsSchema } from "@/lib/booking-page";
import {
  BookingPageNotFoundError,
  findBookingPage,
  updateBookingPage,
} from "@/lib/booking-pages";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers have booking pages" },
      { status: 403 },
    );
  }

  const bookingPage = await findBookingPage(currentUser.user.id);

  if (!bookingPage) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { bookingPage },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers can update booking pages" },
      { status: 403 },
    );
  }

  const input = bookingPageSettingsSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid booking page settings", issues: input.error.issues },
      { status: 400 },
    );
  }

  try {
    const bookingPage = await updateBookingPage(
      currentUser.user.id,
      input.data,
    );

    return NextResponse.json(
      { bookingPage },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BookingPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}
