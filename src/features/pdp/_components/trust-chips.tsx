"use client";

import type { Product } from "@/types";

type TrustChipsProps = {
  product: Product;
  /** From the seller-trust endpoint; omit the verified chip when unknown. */
  sellerVerified?: boolean;
};

/**
 * Compact, backend-driven trust signals shown near the price. One calm, consistent
 * chip style — a hairline-outlined pill — so the row reads as a quiet group rather
 * than four competing badges. Only stock state carries colour (the one signal a
 * buyer scans for first); everything else is neutral. Every value comes from the
 * product (or the seller-trust query).
 */
export function TrustChips({ product, sellerVerified }: TrustChipsProps) {
  const status = product.stockStatus ?? (product.outOfStock ? "out_of_stock" : "in_stock");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {status === "in_stock" && (
        <CalmChip dot="var(--success)" fg="var(--success)">
          In stock
        </CalmChip>
      )}
      {status === "out_of_stock" && (
        <CalmChip dot="var(--red)" fg="var(--red)">
          Out of stock
        </CalmChip>
      )}
      {status === "unavailable" && <CalmChip>Currently unavailable</CalmChip>}

      {sellerVerified && <CalmChip>Verified seller</CalmChip>}

      {product.warranty?.available && (
        <CalmChip>{warrantyLabel(product.warranty.durationMonths)}</CalmChip>
      )}
    </div>
  );
}

/** A single hairline-outlined trust pill. An optional leading dot + text colour
 *  is the only place colour enters the row — reserved for stock state. */
function CalmChip({
  children,
  dot,
  fg = "var(--ink-700)",
}: {
  children: React.ReactNode;
  dot?: string;
  fg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 12px",
        borderRadius: 999,
        border: "1px solid var(--line-200)",
        background: "#fff",
        color: fg,
        fontSize: ".75rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flex: "0 0 auto" }}
        />
      )}
      {children}
    </span>
  );
}

/** e.g. "1-year warranty", "6-month warranty", or a plain "Warranty included"
 *  when the seller marked warranty available without a duration. */
function warrantyLabel(months: number | null | undefined): string {
  if (!months) return "Warranty included";
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years}-year warranty`;
  }
  return `${months}-month warranty`;
}
