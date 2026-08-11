import { and, asc, desc, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { appointments, availabilitySlots, providerStudents } from "@/db/schema";
import { getAvailableTimesForBookingPage } from "@/lib/available-times";
import { findProviderSetup } from "@/lib/provider-profiles";

type ProviderWorkspaceAppointmentRow = {
  accountStudentName: string | null;
  accountStudentEmail: string | null;
  providerStudentId: string | null;
  providerStudentName: string | null;
  providerStudentEmail: string | null;
  id: string;
  windowId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: "scheduled" | "cancelled";
  comment: string | null;
  examName: string | null;
  schoolYear: string | null;
  createdByProvider: boolean;
  rescheduleCount: number;
  createdAt: Date;
};

export async function loadProviderWorkspace(providerId: string) {
  const setup = await findProviderSetup(providerId);

  if (!setup?.profile || !setup.bookingPage) return null;

  const now = new Date();
  const weekEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const appointmentSelection = {
    id: appointments.id,
    windowId: availabilitySlots.availabilityWindowId,
    accountStudentName: user.name,
    accountStudentEmail: user.email,
    providerStudentId: providerStudents.id,
    providerStudentName: providerStudents.displayName,
    providerStudentEmail: providerStudents.email,
    startsAt: availabilitySlots.startsAt,
    endsAt: availabilitySlots.endsAt,
    status: appointments.status,
    comment: appointments.comment,
    examName: appointments.examName,
    schoolYear: appointments.schoolYear,
    createdByProvider: appointments.createdByProvider,
    rescheduleCount: appointments.rescheduleCount,
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
        .leftJoin(user, eq(user.id, appointments.studentId))
        .leftJoin(
          providerStudents,
          eq(providerStudents.id, appointments.providerStudentId),
        )
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
        .leftJoin(user, eq(user.id, appointments.studentId))
        .leftJoin(
          providerStudents,
          eq(providerStudents.id, appointments.providerStudentId),
        )
        .where(eq(availabilitySlots.teacherId, providerId))
        .orderBy(desc(appointments.createdAt))
        .limit(8),
      getAvailableTimesForBookingPage(
        {
          ...setup.bookingPage,
          restBetweenSessionsMinutes: setup.profile.restBetweenSessionsMinutes,
        },
        {
          startsAt: now,
          endsAt: weekEndsAt,
        },
      ),
    ]);

  return {
    profile: setup.profile,
    bookingPage: setup.bookingPage,
    upcomingAppointments: upcomingAppointments.map(presentAppointment),
    recentBookings: recentBookings.map(presentAppointment),
    openTimesThisWeek,
  };
}

function presentAppointment(appointment: ProviderWorkspaceAppointmentRow) {
  const { accountStudentName, accountStudentEmail, ...rest } = appointment;
  return {
    ...rest,
    studentName:
      appointment.providerStudentName ?? accountStudentName ?? "Student",
    studentEmail:
      appointment.providerStudentEmail ?? accountStudentEmail ?? null,
  };
}
