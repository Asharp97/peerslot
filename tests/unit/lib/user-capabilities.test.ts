import { describe, expect, it } from "vitest";

import { resolveUserCapabilities } from "@/lib/user-capabilities";

describe("resolveUserCapabilities", () => {
  it("allows every authenticated user to book", () => {
    expect(resolveUserCapabilities(false)).toEqual({
      canBook: true,
      canProvide: false,
    });
  });

  it("allows users with a provider profile to publish availability", () => {
    expect(resolveUserCapabilities(true)).toEqual({
      canBook: true,
      canProvide: true,
    });
  });
});
