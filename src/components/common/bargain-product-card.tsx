"use client";

import type { Product } from "@/types";
import { ProductCard } from "@/components/common/marketplace";

export function BargainProductCard({
  p,
  onOpen,
  onOffer,
}: {
  p: Product;
  onOpen: (p: Product) => void;
  onOffer: (p: Product) => void;
}) {
  return (
    <ProductCard
      p={p}
      onClick={onOpen}
      ctaLabel="Make an offer"
      ctaIcon="bargain"
      onCta={onOffer}
    />
  );
}
