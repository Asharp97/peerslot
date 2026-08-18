// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LegalDocument } from "@/components/legal-document";

afterEach(cleanup);

describe("LegalDocument", () => {
  it("renders plain text as readable paragraphs", () => {
    render(
      <LegalDocument
        aria-label="Privacy policy"
        text={
          "Your privacy matters.\nThis line stays together.\n\nWe only use necessary data."
        }
      />,
    );

    const document = screen.getByRole("article", { name: "Privacy policy" });

    expect(document.textContent).toContain(
      "Your privacy matters.\nThis line stays together.",
    );
    expect(document.textContent).toContain("We only use necessary data.");
    expect(document.querySelectorAll("p")).toHaveLength(2);
  });

  it("accepts standard article properties and custom classes", () => {
    render(
      <LegalDocument className="legal-copy" data-testid="terms" text="Terms" />,
    );

    expect(screen.getByTestId("terms").classList.contains("legal-copy")).toBe(
      true,
    );
  });
});
