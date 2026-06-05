import { describe, it, expect } from "vitest";
import {
  distinctSellerCount,
  resolveDelivery,
  deliveryChoices,
  deliveryTypeLabel,
  nepalHour,
  deliveryEstimate,
  premiumCutoffPassed,
  type CartLikeItem,
} from "@/lib/delivery-options";

// Money-critical: these fees MUST match bazaarco-api orders.service.ts DELIVERY_FEES
// (standard 149/179, premium 199/229). A drift here overcharges/undercharges
// paying customers, so the values are pinned explicitly.

describe("distinctSellerCount", () => {
  it("returns 0 for an empty/undefined cart", () => {
    expect(distinctSellerCount([])).toBe(0);
    expect(distinctSellerCount()).toBe(0);
  });

  it("counts each seller once regardless of line count", () => {
    const cart: CartLikeItem[] = [{ seller: "s1" }, { seller: "s1" }, { seller: "s2" }];
    expect(distinctSellerCount(cart)).toBe(2);
  });

  it("ignores missing/empty seller ids", () => {
    expect(distinctSellerCount([{ seller: undefined }, { seller: "" }, { seller: "s1" }])).toBe(1);
  });
});

describe("resolveDelivery fees", () => {
  const singleSeller: CartLikeItem[] = [{ seller: "s1" }, { seller: "s1" }];
  const twoSellers: CartLikeItem[] = [{ seller: "s1" }, { seller: "s2" }];

  it("standard single = 149", () => {
    const r = resolveDelivery(singleSeller, "standard");
    expect(r.fee).toBe(149);
    expect(r.combined).toBe(false);
    expect(r.type).toBe("standard");
    expect(r.label).toBe("Standard Delivery");
  });

  it("standard combined (2+ sellers) = 179", () => {
    const r = resolveDelivery(twoSellers, "standard");
    expect(r.fee).toBe(179);
    expect(r.combined).toBe(true);
    expect(r.type).toBe("combined_standard");
    expect(r.label).toBe("Combined Standard Delivery");
  });

  it("premium single = 199", () => {
    const r = resolveDelivery(singleSeller, "premium");
    expect(r.fee).toBe(199);
    expect(r.type).toBe("premium");
  });

  it("premium combined = 229", () => {
    const r = resolveDelivery(twoSellers, "premium");
    expect(r.fee).toBe(229);
    expect(r.combined).toBe(true);
    expect(r.type).toBe("combined_premium");
  });

  it("combined auto-applies at exactly 2 distinct sellers, not 1", () => {
    expect(resolveDelivery([{ seller: "s1" }], "standard").combined).toBe(false);
    expect(resolveDelivery(twoSellers, "standard").combined).toBe(true);
  });

  it("an empty cart still resolves a single-tier fee (combined=false)", () => {
    const r = resolveDelivery([], "standard");
    expect(r.combined).toBe(false);
    expect(r.fee).toBe(149);
  });

  it("carries a non-empty promise line for each tier", () => {
    expect(resolveDelivery([], "standard").promise.length).toBeGreaterThan(0);
    expect(resolveDelivery([], "premium").promise.length).toBeGreaterThan(0);
  });
});

describe("deliveryChoices", () => {
  it("returns both selectable tiers in order", () => {
    const choices = deliveryChoices([{ seller: "s1" }]);
    expect(choices.map((c) => c.tier)).toEqual(["standard", "premium"]);
  });

  it("reflects combined pricing across both tiers for a multi-seller cart", () => {
    const choices = deliveryChoices([{ seller: "a" }, { seller: "b" }]);
    expect(choices.map((c) => c.fee)).toEqual([179, 229]);
  });
});

describe("deliveryTypeLabel", () => {
  it("maps every persisted type key to a friendly label", () => {
    expect(deliveryTypeLabel("standard")).toBe("Standard Delivery");
    expect(deliveryTypeLabel("combined_standard")).toBe("Combined Standard Delivery");
    expect(deliveryTypeLabel("premium")).toBe("Premium Same-Day Delivery");
    expect(deliveryTypeLabel("combined_premium")).toBe("Combined Premium Same-Day Delivery");
  });

  it("falls back to 'Delivery' for null/unknown", () => {
    expect(deliveryTypeLabel(null)).toBe("Delivery");
    expect(deliveryTypeLabel(undefined)).toBe("Delivery");
    expect(deliveryTypeLabel("mystery")).toBe("Delivery");
  });
});

describe("nepalHour / time-based estimates", () => {
  // Build a Date whose Nepal-local (UTC+5:45) hour is `nepalH`.
  function atNepalHour(nepalH: number): Date {
    // 00:00 NPT == 18:15 previous-day UTC. Add nepalH hours in UTC.
    const utcMs = Date.UTC(2026, 5, 5, 18, 15, 0) + nepalH * 3_600_000;
    return new Date(utcMs);
  }

  it("nepalHour is timezone-independent of the host", () => {
    expect(nepalHour(atNepalHour(9))).toBe(9);
    expect(nepalHour(atNepalHour(23))).toBe(23);
  });

  it("premium before 10 AM NPT estimates same-day, after estimates tomorrow", () => {
    expect(deliveryEstimate("premium", atNepalHour(9))).toBe("Today (est.)");
    expect(deliveryEstimate("premium", atNepalHour(11))).toBe("Tomorrow (est.)");
  });

  it("standard before 5 PM NPT estimates tomorrow, after estimates ~2 days", () => {
    expect(deliveryEstimate("standard", atNepalHour(16))).toBe("Tomorrow (est.)");
    expect(deliveryEstimate("standard", atNepalHour(18))).toBe("About 2 days (est.)");
  });

  it("premiumCutoffPassed flips at 10 AM NPT", () => {
    expect(premiumCutoffPassed(atNepalHour(9))).toBe(false);
    expect(premiumCutoffPassed(atNepalHour(10))).toBe(true);
  });
});
