import { NextResponse } from "next/server";

import {
  BookingPageNotFoundError,
  BookingSlugGenerationError,
  regenerateBookingPageSlug,
} from "@/lib/booking-pages";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Only providers can regenerate booking links" },
      { status: 403 },
    );
  }

  try {
    const bookingPage = await regenerateBookingPageSlug(currentUser.user.id);

    return NextResponse.json(
      { bookingPage },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BookingPageNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof BookingSlugGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    throw error;
  }
}
