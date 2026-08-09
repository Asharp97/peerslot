import { NextResponse } from "next/server";

import { bookingSlugSchema } from "@/lib/booking-page";
import { findPublishedBookingPage } from "@/lib/booking-pages";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const input = bookingSlugSchema.safeParse((await context.params).slug);

  if (!input.success) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 },
    );
  }

  const bookingPage = await findPublishedBookingPage(input.data);

  if (!bookingPage) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ bookingPage });
}
