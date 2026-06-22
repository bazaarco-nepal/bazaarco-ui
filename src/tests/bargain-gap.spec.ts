import { describe, expect, it } from "vitest";

import { BARGAIN_MIN_GAP_PERCENT, maxAllowedBargainMinimum } from "@/shared/lib/bargain-gap";

// Expectations derive from the env-driven gap, so changing
// NEXT_PUBLIC_BARGAIN_MIN_GAP_PERCENT can't quietly break these.
const KEEP = 100 - BARGAIN_MIN_GAP_PERCENT; // percent of listed a floor may keep

describe("seller bargain gap (display helper)", () => {
  it("exposes a sane env-driven gap", () => {
    expect(BARGAIN_MIN_GAP_PERCENT).toBeGreaterThan(0);
    expect(BARGAIN_MIN_GAP_PERCENT).toBeLessThan(100);
  });

  it("leaves a (100 − gap)% floor of the listed price", () => {
    expect(maxAllowedBargainMinimum(100)).toBe(KEEP); // Rs.100 → exactly (100 − gap)
    expect(maxAllowedBargainMinimum(1000)).toBe(10 * KEEP);
    expect(maxAllowedBargainMinimum(1200)).toBe(12 * KEEP);
  });

  it("floors fractional results so the gap is always at least the percent", () => {
    expect(maxAllowedBargainMinimum(999)).toBe(Math.floor((999 * KEEP) / 100));
  });

  it("returns 0 for a blank/non-positive listed price so callers can skip the hint", () => {
    expect(maxAllowedBargainMinimum(0)).toBe(0);
    expect(maxAllowedBargainMinimum(Number.NaN)).toBe(0);
  });
});
