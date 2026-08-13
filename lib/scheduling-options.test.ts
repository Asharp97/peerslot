import { describe, expect, it } from "vitest";

import {
  appointmentDurationOptions,
  isFiveMinuteOption,
  restTimeOptions,
} from "./scheduling-options";

describe("scheduling options", () => {
  it("offers appointment durations every five minutes from 10 to 90", () => {
    expect(appointmentDurationOptions[0]).toBe(10);
    expect(appointmentDurationOptions.at(-1)).toBe(90);
    expect(appointmentDurationOptions).toHaveLength(17);
    expect(appointmentDurationOptions).toContain(25);
    expect(appointmentDurationOptions.every((value) => value % 5 === 0)).toBe(
      true,
    );
  });

  it("offers rest times every five minutes from no rest to 60", () => {
    expect(restTimeOptions[0]).toBe(0);
    expect(restTimeOptions.at(-1)).toBe(60);
    expect(restTimeOptions).toHaveLength(13);
    expect(restTimeOptions).toContain(55);
  });

  it("rejects values outside the range or between five-minute steps", () => {
    expect(isFiveMinuteOption(10, 10, 120)).toBe(true);
    expect(isFiveMinuteOption(11, 10, 120)).toBe(false);
    expect(isFiveMinuteOption(95, 10, 90)).toBe(false);
  });
});
