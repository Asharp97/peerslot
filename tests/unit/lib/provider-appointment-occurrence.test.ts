import { describe, expect, it } from "vitest";

import {
  expandProviderAppointmentOccurrences,
  findAppointmentConflictInRows,
  type ProviderAppointmentScheduleRow,
} from "@/lib/provider-appointment-occurrence";

describe("provider appointment occurrences", () => {
  it("expands a weekly series and replaces one occurrence with its exception", () => {
    const occurrences = expandProviderAppointmentOccurrences(
      scheduleRows,
      {
        startsAt: new Date("2030-01-07T00:00:00Z"),
        endsAt: new Date("2030-01-22T00:00:00Z"),
      },
      "UTC",
    );

    expect(occurrences.map(({ startsAt }) => startsAt.toISOString())).toEqual([
      "2030-01-07T09:00:00.000Z",
      "2030-01-15T11:00:00.000Z",
      "2030-01-21T09:00:00.000Z",
    ]);
    expect(occurrences[1]).toMatchObject({
      appointmentId: "exception-id",
      seriesId: "series-id",
      isException: true,
      recurrence: "weekly",
    });
  });

  it("ignores the replaced time and reports the student at the exception time", () => {
    expect(
      findAppointmentConflictInRows(
        scheduleRows,
        {
          startsAt: new Date("2030-01-14T09:00:00Z"),
          endsAt: new Date("2030-01-14T10:00:00Z"),
          recurrence: "none",
        },
        "UTC",
      ),
    ).toBeUndefined();

    expect(
      findAppointmentConflictInRows(
        scheduleRows,
        {
          startsAt: new Date("2030-01-15T11:30:00Z"),
          endsAt: new Date("2030-01-15T12:00:00Z"),
          recurrence: "none",
        },
        "UTC",
      )?.studentName,
    ).toBe("Ada");
  });

  it("detects conflicts between two weekly routines", () => {
    expect(
      findAppointmentConflictInRows(
        scheduleRows,
        {
          startsAt: new Date("2030-01-07T09:30:00Z"),
          endsAt: new Date("2030-01-07T10:30:00Z"),
          recurrence: "weekly",
        },
        "UTC",
      )?.studentName,
    ).toBe("Ada");
  });

  it("does not report a weekly conflict after an existing series cutoff", () => {
    expect(
      findAppointmentConflictInRows(
        scheduleRows.map((row) =>
          row.id === "series-id"
            ? {
                ...row,
                recurrenceEndsAt: new Date("2030-01-21T09:00:00Z"),
              }
            : row,
        ),
        {
          startsAt: new Date("2030-01-21T09:00:00Z"),
          endsAt: new Date("2030-01-21T10:00:00Z"),
          recurrence: "weekly",
        },
        "UTC",
      ),
    ).toBeUndefined();
  });

  it("treats a cancelled exception as a cancelled series occurrence", () => {
    const cancelledExceptionRows = scheduleRows.map((row) =>
      row.id === "exception-id"
        ? { ...row, status: "cancelled" as const }
        : row,
    );

    expect(
      findAppointmentConflictInRows(
        cancelledExceptionRows,
        {
          startsAt: new Date("2030-01-14T09:00:00Z"),
          endsAt: new Date("2030-01-14T10:00:00Z"),
          recurrence: "none",
        },
        "UTC",
      ),
    ).toBeUndefined();
    expect(
      findAppointmentConflictInRows(
        cancelledExceptionRows,
        {
          startsAt: new Date("2030-01-15T11:00:00Z"),
          endsAt: new Date("2030-01-15T12:00:00Z"),
          recurrence: "none",
        },
        "UTC",
      ),
    ).toBeUndefined();
  });

  it("stops expanding a weekly series at its exclusive cutoff", () => {
    const occurrences = expandProviderAppointmentOccurrences(
      scheduleRows.map((row) =>
        row.id === "series-id"
          ? {
              ...row,
              recurrenceEndsAt: new Date("2030-01-21T09:00:00Z"),
            }
          : row,
      ),
      {
        startsAt: new Date("2030-01-07T00:00:00Z"),
        endsAt: new Date("2030-02-01T00:00:00Z"),
      },
      "UTC",
    );

    expect(occurrences.map(({ startsAt }) => startsAt.toISOString())).toEqual([
      "2030-01-07T09:00:00.000Z",
      "2030-01-15T11:00:00.000Z",
    ]);
  });

  it("uses a deleted exception to hide only its original occurrence", () => {
    const occurrences = expandProviderAppointmentOccurrences(
      scheduleRows.map((row) =>
        row.id === "exception-id" ? { ...row, deletedAt: new Date() } : row,
      ),
      {
        startsAt: new Date("2030-01-07T00:00:00Z"),
        endsAt: new Date("2030-01-22T00:00:00Z"),
      },
      "UTC",
    );

    expect(occurrences.map(({ startsAt }) => startsAt.toISOString())).toEqual([
      "2030-01-07T09:00:00.000Z",
      "2030-01-21T09:00:00.000Z",
    ]);
  });
});

const scheduleRows: ProviderAppointmentScheduleRow[] = [
  {
    id: "series-id",
    startsAt: new Date("2030-01-07T09:00:00Z"),
    endsAt: new Date("2030-01-07T10:00:00Z"),
    recurrence: "weekly",
    recurrenceEndsAt: null,
    exceptionForAppointmentId: null,
    exceptionOriginalStartsAt: null,
    deletedAt: null,
    status: "scheduled",
    studentName: "Ada",
  },
  {
    id: "exception-id",
    startsAt: new Date("2030-01-15T11:00:00Z"),
    endsAt: new Date("2030-01-15T12:00:00Z"),
    recurrence: "none",
    recurrenceEndsAt: null,
    exceptionForAppointmentId: "series-id",
    exceptionOriginalStartsAt: new Date("2030-01-14T09:00:00Z"),
    deletedAt: null,
    status: "scheduled",
    studentName: "Ada",
  },
];
