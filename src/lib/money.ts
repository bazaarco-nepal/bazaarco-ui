// The single source of truth for showing money. Prices are rupees end to end
// (no paisa, no conversion) — every screen renders an amount through formatNPR so
// the same value always reads the same way: "Rs. 1,23,456.78", en-IN grouped,
// up to two decimals, with a whole amount left clean (no trailing ".00").

export function roundRs(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatNPR(value: number | null | undefined): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const hasFraction = !Number.isInteger(amount);
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
