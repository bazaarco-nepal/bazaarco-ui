import { describe, it, expect } from "vitest";
import { saleEffective, saleValid, buildPricing, type SaleInput } from "@/lib/discount";

// Mirrors the server's authoritative rules (bazaarco-api catalog.service
// `resolveDiscount`). `base` is the regular price; on sale it becomes `original`
// and the effective `price` is the sale price (amount) or computed (percent).

const amount = (base: number, salePrice: number): SaleInput => ({
  base,
  mode: "amount",
  salePrice,
  salePct: 0,
});
const percent = (base: number, salePct: number): SaleInput => ({
  base,
  mode: "percent",
  salePrice: 0,
  salePct,
});

describe("saleEffective", () => {
  it("computes the discounted price for a percentage (rupees, 2 dp)", () => {
    expect(saleEffective(percent(1000, 20))).toBe(800);
    expect(saleEffective(percent(999, 10))).toBe(899.1); // keeps the decimal
  });
  it("returns the entered sale price for amount mode", () => {
    expect(saleEffective(amount(1000, 750))).toBe(750);
  });
});

describe("saleValid", () => {
  it("accepts a valid percentage and a valid sale price", () => {
    expect(saleValid(percent(1000, 1))).toBe(true);
    expect(saleValid(percent(1000, 99))).toBe(true);
    expect(saleValid(amount(1000, 999))).toBe(true);
  });

  it("rejects a percentage outside 1–99", () => {
    expect(saleValid(percent(1000, 0))).toBe(false);
    expect(saleValid(percent(1000, 100))).toBe(false);
  });

  it("rejects a percentage so large the price would round to zero", () => {
    expect(saleValid(percent(0.4, 99))).toBe(false); // Rs 0.40 → Rs 0.004 → Rs 0.00
  });

  it("rejects a sale price that is not below the regular price", () => {
    expect(saleValid(amount(1000, 1000))).toBe(false);
    expect(saleValid(amount(1000, 1200))).toBe(false);
  });

  it("rejects a zero/empty sale price or base", () => {
    expect(saleValid(amount(1000, 0))).toBe(false);
    expect(saleValid(amount(0, 0))).toBe(false);
    expect(saleValid(percent(0, 20))).toBe(false);
  });

  it("rejects a non-integer percentage but accepts a decimal sale price", () => {
    // Percent off is still a whole number; the rupee sale price may carry decimals.
    expect(saleValid(percent(1000, 10.5))).toBe(false);
    expect(saleValid(amount(1000, 750.5))).toBe(true);
  });
});

describe("buildPricing", () => {
  it("no discount: plain price, discount fields cleared", () => {
    expect(buildPricing(false, amount(1000, 750))).toEqual({
      price: 1000,
      original: null,
      discountType: null,
      discountPct: null,
    });
  });

  it("percent: effective price computed, base kept as original", () => {
    expect(buildPricing(true, percent(1000, 20))).toEqual({
      price: 800,
      original: 1000,
      discountType: "percent",
      discountPct: 20,
    });
  });

  it("amount: entered price kept, base kept as original", () => {
    expect(buildPricing(true, amount(1000, 750))).toEqual({
      price: 750,
      original: 1000,
      discountType: "amount",
      discountPct: null,
    });
  });
});
