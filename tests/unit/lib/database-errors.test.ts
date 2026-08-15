import { describe, expect, it } from "vitest";

import { isPostgresError } from "@/lib/database-errors";

describe("database errors", () => {
  it("recognizes direct and wrapped PostgreSQL error codes", () => {
    expect(isPostgresError({ code: "23505" }, "23505")).toBe(true);
    expect(isPostgresError({ cause: { code: "23505" } }, "23505")).toBe(true);
    expect(isPostgresError(new Error("no code"), "23505")).toBe(false);
  });
});
