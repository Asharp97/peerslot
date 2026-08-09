import { and, asc, eq, gt, isNull, notExists, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  appointments,
  availabilitySlots,
  availabilityWindows,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

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
    .leftJoin(
      availabilityWindows,
      eq(availabilityWindows.id, availabilitySlots.availabilityWindowId),
    )
    .where(
      and(
        eq(availabilitySlots.teacherId, teacherId),
        gt(availabilitySlots.startsAt, new Date()),
        or(
          isNull(availabilitySlots.availabilityWindowId),
          eq(availabilityWindows.isActive, true),
        ),
        notExists(
          db
            .select({ id: appointments.id })
            .from(appointments)
            .where(eq(appointments.slotId, availabilitySlots.id)),
        ),
      ),
    )
    .orderBy(asc(availabilitySlots.startsAt));

  return NextResponse.json({ slots });
}
