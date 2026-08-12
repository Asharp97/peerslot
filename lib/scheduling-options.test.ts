import { describe, expect, it } from "vitest";

import {
  appointmentDurationOptions,
  isFiveMinuteOption,
  restTimeOptions,
} from "./scheduling-options";

describe("scheduling options", () => {
  it("offers appointment durations every five minutes from 10 to 120", () => {
    expect(appointmentDurationOptions[0]).toBe(10);
    expect(appointmentDurationOptions.at(-1)).toBe(120);
    expect(appointmentDurationOptions).toHaveLength(23);
    expect(appointmentDurationOptions).toContain(25);
    expect(appointmentDurationOptions.every((value) => value % 5 === 0)).toBe(
      true,
    );
  });

  it("offers rest times every five minutes from no rest to 120", () => {
    expect(restTimeOptions[0]).toBe(0);
    expect(restTimeOptions.at(-1)).toBe(120);
    expect(restTimeOptions).toHaveLength(25);
    expect(restTimeOptions).toContain(115);
  });

  it("rejects values outside the range or between five-minute steps", () => {
    expect(isFiveMinuteOption(10, 10, 120)).toBe(true);
    expect(isFiveMinuteOption(11, 10, 120)).toBe(false);
    expect(isFiveMinuteOption(125, 10, 120)).toBe(false);
  });
});
