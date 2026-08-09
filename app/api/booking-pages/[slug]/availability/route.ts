import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AvailableTimeConfigurationError,
  AvailableTimeValidationError,
} from "@/lib/available-time";
import { bookingSlugSchema } from "@/lib/booking-page";
import { getAvailableTimesForPublishedBookingPage } from "@/lib/available-times";

const timestampWithOffsetSchema = z.string().datetime({ offset: true });
const rangeSchema = z
  .object({
    startsAt: timestampWithOffsetSchema,
    endsAt: timestampWithOffsetSchema,
  })
  .transform(({ startsAt, endsAt }) => ({
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
  }))
  .refine(({ startsAt, endsAt }) => endsAt > startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const slug = bookingSlugSchema.safeParse((await context.params).slug);
  const searchParams = new URL(request.url).searchParams;
  const range = rangeSchema.safeParse({
    startsAt: searchParams.get("startsAt"),
    endsAt: searchParams.get("endsAt"),
  });

  if (!slug.success) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 },
    );
  }

  if (!range.success) {
    return NextResponse.json(
      { error: "Invalid availability range", issues: range.error.issues },
      { status: 400 },
    );
  }

  try {
    const availability = await getAvailableTimesForPublishedBookingPage(
      slug.data,
      range.data,
    );

    if (!availability) {
      return NextResponse.json(
        { error: "Booking page not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (
      error instanceof AvailableTimeValidationError ||
      error instanceof AvailableTimeConfigurationError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
