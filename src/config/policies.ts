import type { ProductReturns } from "@/types";

/**
 * BazaarCo's platform return policy. Every order ships with a standard 7-day
 * free return; a product may override the window/type via its own backend
 * fields. This is the single client-side source for the default — used as the
 * seller-form default and as the PDP fallback when a product carries no
 * override. The backend already resolves `product.returns.windowDays`
 * server-side, so display code should prefer that and only fall back here.
 */
export const DEFAULT_RETURN: ProductReturns = {
  eligible: true,
  windowDays: 7,
  type: "free_return",
};

/** Human label for a return policy, e.g. "7-day free returns". */
export function returnPolicyLabel(returns: ProductReturns = DEFAULT_RETURN): string {
  if (!returns.eligible || returns.type === "no_return") return "No returns";
  const kind = returns.type === "free_return" ? "free returns" : "returns";
  return `${returns.windowDays}-day ${kind}`;
}
