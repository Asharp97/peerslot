import {
  calculateAvailableTimes,
  type AppointmentForCalculation,
  type AvailabilityBookingPage,
  type AvailabilityWindowForCalculation,
  type AvailableTimeRange,
} from "./available-time";

export type AvailableTimeRepository = {
  loadActiveWindows: (
    bookingPageId: string,
    range: AvailableTimeRange,
    timeZone: string,
  ) => Promise<AvailabilityWindowForCalculation[]>;
  loadAppointments: (
    bookingPageId: string,
    range: AvailableTimeRange,
    restBetweenSessionsMinutes: number,
  ) => Promise<AppointmentForCalculation[]>;
};

export function createAvailableTimeService(
  repository: AvailableTimeRepository,
  now: () => Date = () => new Date(),
) {
  return {
    async calculate(
      bookingPage: AvailabilityBookingPage,
      range: AvailableTimeRange,
    ) {
      const [windows, appointments] = await Promise.all([
        repository.loadActiveWindows(
          bookingPage.id,
          range,
          bookingPage.timeZone,
        ),
        repository.loadAppointments(
          bookingPage.id,
          range,
          bookingPage.restBetweenSessionsMinutes,
        ),
      ]);

      return calculateAvailableTimes({
        bookingPage,
        range,
        windows,
        appointments,
        now: now(),
      });
    },
  };
}
