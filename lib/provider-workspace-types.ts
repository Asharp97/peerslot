export type ProviderWorkspaceAppointment = {
  id: string;
  windowId: string | null;
  studentName: string;
  studentEmail: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "cancelled";
  createdAt: string;
};

export type ProviderWorkspaceData = {
  profile: {
    displayName: string;
    professionalTitle: string;
    timeZone: string;
    defaultAppointmentDurationMinutes: number;
    minimumBookingNoticeMinutes: number;
    restBetweenSessionsMinutes: number;
  };
  bookingPage: {
    id: string;
    slug: string;
    title: string;
    timeZone: string;
    appointmentDurationMinutes: number;
    bookingIntervalMinutes: number;
    minimumNoticeHours: number;
    isPublished: boolean;
  };
  upcomingAppointments: ProviderWorkspaceAppointment[];
  recentBookings: ProviderWorkspaceAppointment[];
  openTimesThisWeek: Array<{
    startsAt: string;
    endsAt: string;
    localized: { en: string; tr: string };
  }>;
};
