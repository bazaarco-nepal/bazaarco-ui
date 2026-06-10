import { afterEach, describe, expect, it, vi } from "vitest";

import { bargainExpiryLabel } from "@/lib/bargain-expiry";

describe("bargainExpiryLabel", () => {
  afterEach(() => vi.useRealTimers());

  const freezeAt = (iso: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  };

  it("renders hours and minutes remaining", () => {
    freezeAt("2026-06-10T10:00:00.000Z");
    expect(bargainExpiryLabel("2026-06-11T08:14:30.000Z")).toBe("Expires in 22h 14m");
  });

  it("drops the hour part inside the final hour", () => {
    freezeAt("2026-06-10T10:00:00.000Z");
    expect(bargainExpiryLabel("2026-06-10T10:45:00.000Z")).toBe("Expires in 45m");
  });

  it("warns inside the final minute instead of showing 0m", () => {
    freezeAt("2026-06-10T10:00:00.000Z");
    expect(bargainExpiryLabel("2026-06-10T10:00:30.000Z")).toBe("Expires in under a minute");
  });

  it("returns null for lapsed, absent, or unparseable deadlines", () => {
    freezeAt("2026-06-10T10:00:00.000Z");
    expect(bargainExpiryLabel("2026-06-10T09:00:00.000Z")).toBeNull();
    expect(bargainExpiryLabel(null)).toBeNull();
    expect(bargainExpiryLabel(undefined)).toBeNull();
    expect(bargainExpiryLabel("not-a-date")).toBeNull();
  });
});
