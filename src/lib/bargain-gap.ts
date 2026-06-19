// Seller-side bargain gap — DISPLAY/UX ONLY.
//
// The backend env var BARGAIN_MIN_GAP_PERCENT is the source of truth and
// re-validates every product/variant save; the seller never gets past it by
// tampering with the form. This mirror exists only so the seller product form
// can render helper text and pre-submit hints ("max allowed minimum: Rs. X")
// without a round-trip. Keep it in sync with the backend default (10). It is a
// SELLER-facing value: never import this into any buyer page or payload.

const RAW = process.env.NEXT_PUBLIC_BARGAIN_MIN_GAP_PERCENT;
const PARSED = Number(RAW);

export const BARGAIN_MIN_GAP_PERCENT =
  Number.isFinite(PARSED) && PARSED > 0 && PARSED < 100 ? PARSED : 10;

/**
 * Highest floor a seller may set for a listed price, floored so the gap is always
 * at least BARGAIN_MIN_GAP_PERCENT (matches the backend's getMaxAllowedBargainMinimum).
 * Returns 0 for a non-positive/blank listed price so callers can skip the hint.
 */
export function maxAllowedBargainMinimum(listedPrice: number): number {
  if (!(listedPrice > 0)) return 0;
  return Math.floor((listedPrice * (100 - BARGAIN_MIN_GAP_PERCENT)) / 100);
}
