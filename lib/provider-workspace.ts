import { and, asc, desc, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { appointments, availabilitySlots } from "@/db/schema";
import { getAvailableTimesForBookingPage } from "@/lib/available-times";
import { findProviderSetup } from "@/lib/provider-profiles";

export async function loadProviderWorkspace(providerId: string) {
  const setup = await findProviderSetup(providerId);

  if (!setup?.profile || !setup.bookingPage) return null;

  const now = new Date();
  const weekEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const appointmentSelection = {
    id: appointments.id,
    windowId: availabilitySlots.availabilityWindowId,
    studentName: user.name,
    studentEmail: user.email,
    startsAt: availabilitySlots.startsAt,
    endsAt: availabilitySlots.endsAt,
    status: appointments.status,
    createdAt: appointments.createdAt,
  };

  const [upcomingAppointments, recentBookings, openTimesThisWeek] =
    await Promise.all([
      db
        .select(appointmentSelection)
        .from(appointments)
        .innerJoin(
          availabilitySlots,
          eq(availabilitySlots.id, appointments.slotId),
        )
        .innerJoin(user, eq(user.id, appointments.studentId))
        .where(
          and(
            eq(availabilitySlots.teacherId, providerId),
            eq(appointments.status, "scheduled"),
            gt(availabilitySlots.startsAt, now),
          ),
        )
        .orderBy(asc(availabilitySlots.startsAt))
        .limit(12),
      db
        .select(appointmentSelection)
        .from(appointments)
        .innerJoin(
          availabilitySlots,
          eq(availabilitySlots.id, appointments.slotId),
        )
        .innerJoin(user, eq(user.id, appointments.studentId))
        .where(eq(availabilitySlots.teacherId, providerId))
        .orderBy(desc(appointments.createdAt))
        .limit(8),
      getAvailableTimesForBookingPage(setup.bookingPage, {
        startsAt: now,
        endsAt: weekEndsAt,
      }),
    ]);

  return {
    profile: setup.profile,
    bookingPage: setup.bookingPage,
    upcomingAppointments,
    recentBookings,
    openTimesThisWeek,
  };
}
