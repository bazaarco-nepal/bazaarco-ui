import { describe, it, expect } from "vitest";

import { formatNPR, roundRs } from "@/lib/money";

// The single money formatter: rupees, en-IN grouping, up to 2 decimals, whole
// amounts left clean. Every price on every screen flows through this.
describe("formatNPR", () => {
  it("groups whole rupees with en-IN and drops trailing .00", () => {
    expect(formatNPR(1200)).toBe("Rs. 1,200");
    expect(formatNPR(123456)).toBe("Rs. 1,23,456");
  });

  it("shows decimals when present (e.g. Rs 100.19)", () => {
    expect(formatNPR(100.19)).toBe("Rs. 100.19");
    expect(formatNPR(100.1)).toBe("Rs. 100.1");
  });

  it("falls back to Rs. 0 for nullish/non-finite input", () => {
    expect(formatNPR(null)).toBe("Rs. 0");
    expect(formatNPR(undefined)).toBe("Rs. 0");
    expect(formatNPR(Number.NaN)).toBe("Rs. 0");
  });
});

describe("roundRs", () => {
  it("snaps float drift to 2 dp", () => {
    expect(roundRs(0.1 + 0.2)).toBe(0.3);
    expect(roundRs(899.1)).toBe(899.1);
  });
});
