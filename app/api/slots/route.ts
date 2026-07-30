import { and, asc, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { availabilitySlots } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

const createSlotSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine(({ startsAt, endsAt }) => endsAt > startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  })
  .refine(({ startsAt }) => startsAt > new Date(), {
    message: "startsAt must be in the future",
    path: ["startsAt"],
  });

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherId =
    new URL(request.url).searchParams.get("teacherId") ?? currentUser.user.id;

  const slots = await db
    .select({
      id: availabilitySlots.id,
      teacherId: availabilitySlots.teacherId,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
    })
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.teacherId, teacherId),
        gt(availabilitySlots.startsAt, new Date()),
      ),
    )
    .orderBy(asc(availabilitySlots.startsAt));

  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (currentUser.role !== "teacher") {
    return NextResponse.json(
      { error: "Only teachers can create availability slots" },
      { status: 403 },
    );
  }

  const input = createSlotSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        issues: input.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const [slot] = await db
      .insert(availabilitySlots)
      .values({
        teacherId: currentUser.user.id,
        startsAt: input.data.startsAt,
        endsAt: input.data.endsAt,
      })
      .returning();

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "A slot already starts at that time" },
        { status: 409 },
      );
    }

    throw error;
  }
}
