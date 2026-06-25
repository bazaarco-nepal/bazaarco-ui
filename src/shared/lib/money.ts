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

export function formatNPR(value: number | null | undefined, locale: "en" | "ne" = "en"): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const hasFraction = !Number.isInteger(amount);
  const numberLocale = locale === "ne" ? "ne-NP" : "en-IN";
  const prefix = locale === "ne" ? "रु." : "Rs.";

  return `${prefix} ${amount.toLocaleString(numberLocale, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
