// BazaarCo Kathmandu Valley launch delivery pricing.
// The customer chooses a SPEED tier (Standard next-day / Premium same-day).
// "Combined" pricing applies automatically when the cart spans 2+ distinct
// sellers (per the Delivery Details doc) — it is never a manual choice.
// Keep these fees in sync with the backend (orders.service.ts DELIVERY_FEES).

export type DeliveryTier = "standard" | "premium";

const DELIVERY_FEES: Record<DeliveryTier, { single: number; combined: number }> = {
  standard: { single: 149, combined: 179 },
  premium: { single: 199, combined: 229 },
};

export interface CartLikeItem {
  /** Product.seller id — used to count distinct sellers for combined pricing. */
  seller?: string;
}

/** Distinct seller count drives single vs combined pricing. */
export function distinctSellerCount(cart: CartLikeItem[] = []): number {
  return new Set(cart.map((it) => it.seller).filter(Boolean)).size;
}

export interface ResolvedDelivery {
  tier: DeliveryTier;
  combined: boolean;
  fee: number;
  /** 'standard' | 'combined_standard' | 'premium' | 'combined_premium' */
  type: string;
  /** Human label for the resolved option. */
  label: string;
  /** Short promise/rule line. */
  promise: string;
}

const TIER_META: Record<
  DeliveryTier,
  { base: string; combinedBase: string; promise: () => string }
> = {
  standard: {
    base: "Standard Delivery",
    combinedBase: "Combined Standard Delivery",
    // Plain, example-based, and always "estimated" — never a hard promise.
    promise: () =>
      "Order before 5 PM and it's estimated to arrive the next day. Order later and it's estimated at about 2 days.",
  },
  premium: {
    base: "Premium Same-Day Delivery",
    combinedBase: "Combined Premium Same-Day Delivery",
    promise: () =>
      "Order before 10 AM and it's estimated to arrive the same day. For example, order after 10 AM and it's estimated for the next day.",
  },
};

/** Resolve the option + fee for a chosen tier given the cart's seller spread. */
export function resolveDelivery(cart: CartLikeItem[], tier: DeliveryTier): ResolvedDelivery {
  const combined = distinctSellerCount(cart) >= 2;
  const meta = TIER_META[tier];
  return {
    tier,
    combined,
    fee: DELIVERY_FEES[tier][combined ? "combined" : "single"],
    type: `${combined ? "combined_" : ""}${tier}`,
    label: combined ? meta.combinedBase : meta.base,
    promise: meta.promise(),
  };
}

/** Both selectable tiers, resolved for the current cart (for rendering a picker). */
export function deliveryChoices(cart: CartLikeItem[]): ResolvedDelivery[] {
  return (["standard", "premium"] as DeliveryTier[]).map((t) => resolveDelivery(cart, t));
}

/** Friendly label for a persisted delivery type key (e.g. on an order). */
export function deliveryTypeLabel(type?: string | null): string {
  switch (type) {
    case "standard":
      return "Standard Delivery";
    case "combined_standard":
      return "Combined Standard Delivery";
    case "premium":
      return "Premium Same-Day Delivery";
    case "combined_premium":
      return "Combined Premium Same-Day Delivery";
    default:
      return "Delivery";
  }
}

/** Nepal Standard Time hour (UTC+5:45), independent of the device timezone. */
export function nepalHour(now: Date = new Date()): number {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + (5 * 60 + 45) * 60_000).getHours();
}

/**
 * Plain, honest delivery estimate (no jargon). Premium before 10 AM arrives the
 * same day, otherwise the next day; Standard before 5 PM arrives the next day,
 * otherwise in 2 days. We never promise a window we can't honour.
 */
export function deliveryEstimate(tier: DeliveryTier, now: Date = new Date()): string {
  const hour = nepalHour(now);
  if (tier === "premium") {
    return hour < 10 ? "Today (est.)" : "Tomorrow (est.)";
  }
  return hour < 17 ? "Tomorrow (est.)" : "About 2 days (est.)";
}

/** Whether the same-day cutoff for Premium has passed (for an honest note). */
export function premiumCutoffPassed(now: Date = new Date()): boolean {
  return nepalHour(now) >= 10;
}
