"use client";

import React from "react";
import { Badge } from "@/components/ui";
import type { Product } from "@/types";

type TrustChipsProps = {
  product: Product;
};

/**
 * Compact, backend-driven trust signals shown near the price. Every pill is the
 * shared {@link Badge}, so the row reads as one calm group differentiated only by
 * semantic colour — never by shape. Stock is the one signal a buyer scans for
 * first, so it carries a coloured dot + tint; everything else stays neutral.
 *
 * The "Verified seller" fact is intentionally NOT shown here — the seller card
 * already states it, and surfacing the same fact twice is noise.
 */
export function TrustChips({ product }: TrustChipsProps) {
  const status = product.stockStatus ?? (product.outOfStock ? "out_of_stock" : "in_stock");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {status === "in_stock" && (
        <Badge tone="success" dot>
          In stock
        </Badge>
      )}
      {status === "out_of_stock" && (
        <Badge tone="danger" dot>
          Out of stock
        </Badge>
      )}
      {status === "unavailable" && <Badge>Currently unavailable</Badge>}

      {product.warranty?.available && (
        <Badge>{warrantyLabel(product.warranty.durationMonths)}</Badge>
      )}
    </div>
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
