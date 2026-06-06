// Seller-side discount math for single-price products. Mirrors the server's
// authoritative rules (bazaarco-api catalog.service `resolveDiscount`) so the
// Add/Edit Product form can validate and preview before submitting.
//
// Contract: `base` is the regular price. On sale, `base` becomes the
// struck-through `original` and the effective `price` is either the entered sale
// price (amount mode) or computed from the percentage (percent mode).

export type SaleMode = "amount" | "percent";

export interface SaleInput {
  base: number;
  mode: SaleMode;
  /** Entered sale price (amount mode). */
  salePrice: number;
  /** Entered percentage off (percent mode). */
  salePct: number;
}

export interface Pricing {
  price: number;
  original: number | null;
  discountType: SaleMode | null;
  discountPct: number | null;
}

/** Effective (sale) price for the given input. */
export function saleEffective(input: SaleInput): number {
  return input.mode === "percent"
    ? Math.round(input.base * (1 - input.salePct / 100))
    : input.salePrice;
}

/**
 * Whether a sale input is valid: percent in 1–99 with a non-zero result, or a
 * sale price strictly between 0 and the regular price.
 */
export function saleValid(input: SaleInput): boolean {
  if (!Number.isFinite(input.base) || input.base <= 0) return false;
  if (input.mode === "percent") {
    return (
      Number.isInteger(input.salePct) &&
      input.salePct >= 1 &&
      input.salePct <= 99 &&
      saleEffective(input) >= 1
    );
  }
  return Number.isInteger(input.salePrice) && input.salePrice >= 1 && input.salePrice < input.base;
}

/**
 * Build the API pricing shape. When `onSale` is false (or for cases the caller
 * treats as no-discount), returns the plain base price with the discount fields
 * cleared. The server still re-validates and recomputes percentage prices.
 */
export function buildPricing(onSale: boolean, input: SaleInput): Pricing {
  if (!onSale) {
    return { price: input.base, original: null, discountType: null, discountPct: null };
  }
  if (input.mode === "percent") {
    return {
      price: saleEffective(input),
      original: input.base,
      discountType: "percent",
      discountPct: input.salePct,
    };
  }
  return {
    price: input.salePrice,
    original: input.base,
    discountType: "amount",
    discountPct: null,
  };
}
