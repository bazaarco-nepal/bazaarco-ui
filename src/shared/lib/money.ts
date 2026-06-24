// The single source of truth for showing money. Prices are WHOLE rupees end to
// end (integers — no paisa, no decimals) — every screen renders an amount through
// formatNPR so the same value always reads the same way: "Rs. 1,23,456", en-IN
// grouped, no decimals.

// Percentage-derived money (a percent discount preview) rounds UP to the next
// whole rupee, mirroring the server's ceilRs so the preview matches what gets
// stored. Snap to 2 dp first so float dust on an exact integer can't over-ceil.
export function ceilRs(amount: number): number {
  return Math.ceil(Math.round(amount * 100) / 100);
}

export function formatNPR(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const hasFraction = !Number.isInteger(amount);
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
