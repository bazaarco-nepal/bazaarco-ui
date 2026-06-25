"use client";

import { useTranslation } from "react-i18next";
import type { Product } from "@/types";
import type { ProductOpenSource } from "@/types/bazaar";
import { ProductCard } from "@/components/common/marketplace";

export function BargainProductCard({
  p,
  onOpen,
  onOffer,
  source,
}: {
  p: Product;
  onOpen: (p: Product) => void;
  onOffer: (p: Product) => void;
  source?: ProductOpenSource;
}) {
  const { t } = useTranslation();

  return (
    <ProductCard
      p={p}
      onClick={onOpen}
      source={source}
      ctaLabel={t("pdp.makeOffer")}
      ctaIcon="bargain"
      onCta={(product) => onOffer(product)}
    />
  );
}
