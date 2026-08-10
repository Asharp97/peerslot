const fallbackTimeZones = [
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export function getTimeZones(current?: string) {
  const timeZoneIntl = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const supported =
    timeZoneIntl.supportedValuesOf?.("timeZone") ?? fallbackTimeZones;

  return Array.from(new Set([current, ...supported, "UTC"])).filter(
    (timeZone): timeZone is string => Boolean(timeZone),
  );
}
