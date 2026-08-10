import {
  formatInTimeZone,
  type AvailabilityWindowRange,
  type AvailabilityWindowRule,
} from "./availability-window";
import { zonedLocalDateTimeToUtc } from "./provider-availability";

const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;

export function expandAvailabilityRule(
  rule: AvailabilityWindowRule & { id: string; isActive: boolean },
  range: AvailabilityWindowRange,
  timeZone: string,
) {
  if (!rule.isActive) return [];

  if (rule.recurrence === "none") {
    return rangesOverlap(rule, range) ? [rule] : [];
  }

  const localStartsAt = splitLocalDateTime(
    formatInTimeZone(rule.startsAt, timeZone),
  );
  const localEndsAt = splitLocalDateTime(
    formatInTimeZone(rule.endsAt, timeZone),
  );
  const rangeLocalDate = splitLocalDateTime(
    formatInTimeZone(range.startsAt, timeZone),
  ).date;
  const endDayOffset = daysBetween(localStartsAt.date, localEndsAt.date);
  const weeksFromStart = Math.max(
    0,
    Math.floor(daysBetween(localStartsAt.date, rangeLocalDate) / 7) - 1,
  );
  const occurrences = [];

  for (let week = weeksFromStart; week < weeksFromStart + 5200; week += 1) {
    const occurrenceDate = addDays(localStartsAt.date, week * 7);
    const occurrenceStartsAt = zonedLocalDateTimeToUtc(
      occurrenceDate,
      localStartsAt.time,
      timeZone,
    );

    if (occurrenceStartsAt >= range.endsAt) break;

    const occurrenceEndsAt = zonedLocalDateTimeToUtc(
      addDays(occurrenceDate, endDayOffset),
      localEndsAt.time,
      timeZone,
    );

    if (occurrenceEndsAt > range.startsAt) {
      occurrences.push({
        id: `${rule.id}:${occurrenceStartsAt.toISOString()}`,
        startsAt: occurrenceStartsAt,
        endsAt: occurrenceEndsAt,
        isActive: true,
      });
    }
  }

  return occurrences;
}

export function availabilityRulesOverlap(
  first: AvailabilityWindowRule,
  second: AvailabilityWindowRule,
  timeZone: string,
) {
  if (first.recurrence === "none" && second.recurrence === "none") {
    return rangesOverlap(first, second);
  }

  if (first.recurrence === "none" || second.recurrence === "none") {
    const oneOff = first.recurrence === "none" ? first : second;
    const recurring = first.recurrence === "weekly" ? first : second;

    return expandAvailabilityRule(
      { ...recurring, id: "recurring", isActive: true },
      oneOff,
      timeZone,
    ).some((occurrence) => rangesOverlap(occurrence, oneOff));
  }

  const comparisonStartsAt = new Date(
    Math.max(first.startsAt.getTime(), second.startsAt.getTime()),
  );
  const comparisonRange = {
    startsAt: comparisonStartsAt,
    endsAt: new Date(comparisonStartsAt.getTime() + 2 * weekMilliseconds),
  };
  const firstOccurrences = expandAvailabilityRule(
    { ...first, id: "first", isActive: true },
    comparisonRange,
    timeZone,
  );
  const secondOccurrences = expandAvailabilityRule(
    { ...second, id: "second", isActive: true },
    comparisonRange,
    timeZone,
  );

  return firstOccurrences.some((firstOccurrence) =>
    secondOccurrences.some((secondOccurrence) =>
      rangesOverlap(firstOccurrence, secondOccurrence),
    ),
  );
}

function rangesOverlap(
  first: AvailabilityWindowRange,
  second: AvailabilityWindowRange,
) {
  return first.startsAt < second.endsAt && first.endsAt > second.startsAt;
}

function splitLocalDateTime(value: string) {
  const [date, timeWithSeconds] = value.split("T");
  return { date, time: timeWithSeconds.slice(0, 5) };
}

function daysBetween(first: string, second: string) {
  return Math.round((dateOrdinal(second) - dateOrdinal(first)) / 86_400_000);
}

function dateOrdinal(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(value: string, days: number) {
  const date = new Date(dateOrdinal(value) + days * 86_400_000);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
