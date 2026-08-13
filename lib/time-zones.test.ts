import { describe, expect, it } from "vitest";

import { formatTimeZoneLabel, getTimeZones } from "./time-zones";

describe("time-zone options", () => {
  it("includes UTC and preserves the provider's current zone", () => {
    const timeZones = getTimeZones("Custom/Legacy_Zone");

    expect(timeZones[0]).toBe("Custom/Legacy_Zone");
    expect(timeZones).toContain("UTC");
    expect(new Set(timeZones).size).toBe(timeZones.length);
  });

  it("localizes time-zone labels without changing their IANA value", () => {
    expect(formatTimeZoneLabel("Europe/Istanbul", "en")).toBe(
      "Türkiye Time (Europe/Istanbul)",
    );
    expect(formatTimeZoneLabel("Europe/Istanbul", "tr")).toBe(
      "Türkiye Saati (Europe/Istanbul)",
    );
  });

  it("falls back to the IANA value for an unsupported legacy zone", () => {
    expect(formatTimeZoneLabel("Custom/Legacy_Zone", "tr")).toBe(
      "Custom/Legacy_Zone",
    );
  });
});
