import { describe, expect, it } from "vitest";

import { BARGAIN_MIN_GAP_PERCENT, maxAllowedBargainMinimum } from "@/shared/lib/bargain-gap";

describe("seller bargain gap (display helper)", () => {
  it("defaults the gap to 10% when no env override is set", () => {
    expect(BARGAIN_MIN_GAP_PERCENT).toBe(10);
  });

  it("returns 90% of a clean listed price", () => {
    expect(maxAllowedBargainMinimum(1000)).toBe(900);
    expect(maxAllowedBargainMinimum(1200)).toBe(1080);
  });

  it("floors fractional results so the gap is always at least the percent", () => {
    expect(maxAllowedBargainMinimum(999)).toBe(899);
  });

  it("matches the backend rule for small prices", () => {
    expect(maxAllowedBargainMinimum(100)).toBe(90);
  });

  it("returns 0 for a blank/non-positive listed price so callers can skip the hint", () => {
    expect(maxAllowedBargainMinimum(0)).toBe(0);
    expect(maxAllowedBargainMinimum(Number.NaN)).toBe(0);
  });
});
