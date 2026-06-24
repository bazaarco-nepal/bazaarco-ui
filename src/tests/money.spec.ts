import { describe, it, expect } from "vitest";

import { formatNPR, ceilRs } from "@/shared/lib/money";
import { saleEffective } from "@/shared/lib/discount";

// The single money formatter: whole rupees, en-IN grouping, no decimals. Every
// price on every screen flows through this. (It still pads a stray fraction
// defensively, but money is whole rupees end to end.)
describe("formatNPR", () => {
  it("groups whole rupees with en-IN and drops decimals", () => {
    expect(formatNPR(1200)).toBe("Rs. 1,200");
    expect(formatNPR(123456)).toBe("Rs. 1,23,456");
  });

  it("falls back to Rs. 0 for nullish/non-finite input", () => {
    expect(formatNPR(null)).toBe("Rs. 0");
    expect(formatNPR(undefined)).toBe("Rs. 0");
    expect(formatNPR(Number.NaN)).toBe("Rs. 0");
  });
});

// Percentage-derived money rounds UP to the whole rupee, matching the server.
describe("ceilRs", () => {
  it("leaves a whole rupee and rounds any fraction up", () => {
    expect(ceilRs(3)).toBe(3);
    expect(ceilRs(3.01)).toBe(4);
    expect(ceilRs(899.1)).toBe(900);
  });

  it("does not over-ceil float dust on an exact integer", () => {
    expect(ceilRs(0.1 + 0.2)).toBe(1);
    expect(ceilRs(56400.0000001)).toBe(56400);
  });
});

describe("saleEffective", () => {
  it("ceils a percentage sale price to the whole rupee (matches the server)", () => {
    expect(saleEffective({ base: 999, mode: "percent", salePrice: 0, salePct: 10 })).toBe(900);
  });

  it("uses the entered amount as-is in amount mode", () => {
    expect(saleEffective({ base: 1000, mode: "amount", salePrice: 750, salePct: 0 })).toBe(750);
  });
});
