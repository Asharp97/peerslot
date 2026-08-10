import { describe, expect, it } from "vitest";

import { getTimeZones } from "./time-zones";

describe("time-zone options", () => {
  it("includes UTC and preserves the provider's current zone", () => {
    const timeZones = getTimeZones("Custom/Legacy_Zone");

    expect(timeZones[0]).toBe("Custom/Legacy_Zone");
    expect(timeZones).toContain("UTC");
    expect(new Set(timeZones).size).toBe(timeZones.length);
  });
});
