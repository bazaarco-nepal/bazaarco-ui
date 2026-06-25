"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <ProductCard
      p={p}
      onClick={onOpen}
      ctaLabel={t("pdp.makeOffer")}
      ctaIcon="bargain"
      onCta={onOffer}
    />
  );
}
