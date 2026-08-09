export const availabilityLocales = ["en", "tr"] as const;

export type AvailabilityLocale = (typeof availabilityLocales)[number];

export type AvailabilityBookingPage = {
  id: string;
  timeZone: string;
  appointmentDurationMinutes: number;
  bookingIntervalMinutes: number;
  minimumNoticeHours: number;
};

export type AvailableTimeRange = {
  startsAt: Date;
  endsAt: Date;
};

export type AvailabilityWindowForCalculation = AvailableTimeRange & {
  id: string;
  isActive: boolean;
};

export type AppointmentForCalculation = AvailableTimeRange & {
  status: "scheduled" | "cancelled";
};

export type AvailableTime = AvailableTimeRange & {
  localized: Record<AvailabilityLocale, string>;
};

export class AvailableTimeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailableTimeValidationError";
  }
}

export class AvailableTimeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailableTimeConfigurationError";
  }
}

export function calculateAvailableTimes(input: {
  bookingPage: AvailabilityBookingPage;
  range: AvailableTimeRange;
  windows: AvailabilityWindowForCalculation[];
  appointments: AppointmentForCalculation[];
  now: Date;
}) {
  const { bookingPage, range, windows, appointments, now } = input;
  validateCalculationInput(bookingPage, range);

  const durationMilliseconds =
    bookingPage.appointmentDurationMinutes * 60 * 1000;
  const intervalMilliseconds = bookingPage.bookingIntervalMinutes * 60 * 1000;
  const minimumNoticeCutoff = new Date(
    now.getTime() + bookingPage.minimumNoticeHours * 60 * 60 * 1000,
  );
  const scheduledAppointments = appointments.filter(
    ({ status }) => status === "scheduled",
  );
  const candidates = new Map<number, AvailableTime>();

  for (const window of windows) {
    if (!window.isActive) continue;

    for (
      let startsAtMilliseconds = window.startsAt.getTime();
      startsAtMilliseconds + durationMilliseconds <= window.endsAt.getTime();
      startsAtMilliseconds += intervalMilliseconds
    ) {
      const startsAt = new Date(startsAtMilliseconds);
      const endsAt = new Date(startsAtMilliseconds + durationMilliseconds);

      if (startsAt < range.startsAt || endsAt > range.endsAt) continue;
      if (startsAt < minimumNoticeCutoff) continue;
      if (
        scheduledAppointments.some((appointment) =>
          rangesOverlap({ startsAt, endsAt }, appointment),
        )
      ) {
        continue;
      }

      candidates.set(startsAtMilliseconds, {
        startsAt,
        endsAt,
        localized: localizeAvailableTime(startsAt, bookingPage.timeZone),
      });
    }
  }

  return [...candidates.values()].sort(
    (first, second) => first.startsAt.getTime() - second.startsAt.getTime(),
  );
}

export function localizeAvailableTime(date: Date, timeZone: string) {
  return {
    en: new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "full",
      timeStyle: "short",
    }).format(date),
    tr: new Intl.DateTimeFormat("tr-TR", {
      timeZone,
      dateStyle: "full",
      timeStyle: "short",
    }).format(date),
  };
}

function validateCalculationInput(
  bookingPage: AvailabilityBookingPage,
  range: AvailableTimeRange,
) {
  if (range.endsAt <= range.startsAt) {
    throw new AvailableTimeValidationError(
      "Availability range must end after it starts",
    );
  }

  if (
    bookingPage.appointmentDurationMinutes <= 0 ||
    bookingPage.bookingIntervalMinutes <= 0
  ) {
    throw new AvailableTimeConfigurationError(
      "Appointment duration and booking interval must be positive",
    );
  }

  if (
    bookingPage.appointmentDurationMinutes !==
    bookingPage.bookingIntervalMinutes
  ) {
    throw new AvailableTimeConfigurationError(
      "Appointment duration must equal the booking interval for the MVP",
    );
  }
}

function rangesOverlap(first: AvailableTimeRange, second: AvailableTimeRange) {
  return first.startsAt < second.endsAt && first.endsAt > second.startsAt;
}
