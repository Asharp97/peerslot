// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ProviderSettings,
  type ProviderSettingsCopy,
} from "./provider-settings";

vi.mock("./provider-shell", () => ({
  useProviderWorkspace: () => ({
    accessToken: "access-token",
    data: {
      profile: { restBetweenSessionsMinutes: 10 },
      bookingPage: {
        title: "Book a session",
        appointmentDurationMinutes: 45,
        minimumNoticeHours: 24,
        timeZone: "Europe/Istanbul",
        isPublished: true,
        slug: "ABCDEFGH",
      },
    },
    refresh: vi.fn(),
  }),
}));

vi.mock("./time-zone-combobox", () => ({
  TimeZoneCombobox: ({ locale }: { locale: string }) => (
    <button type="button">timeZone-{locale}</button>
  ),
}));

describe("provider scheduling settings", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("uses select controls for duration, rest, and notice", () => {
    const { container } = render(<ProviderSettings copy={copy} locale="tr" />);
    const selects = screen.getAllByRole("combobox");

    expect(selects).toHaveLength(3);
    expect(container.querySelector('input[type="number"]')).toBeNull();
    expect(screen.getByRole("button", { name: "timeZone-tr" })).toBeTruthy();
    for (const select of selects) {
      expect(select.className).toContain("focus-visible:ring-0");
    }
  });
});

const copy = new Proxy(
  {},
  { get: (_target, property) => String(property) },
) as ProviderSettingsCopy;
