"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { SkeletonCard, SectionHead } from "@/components/ui";
import { browsePath } from "@/config/routes";
import { ProductCard, useBz } from "@/components/common";
import { useVisibleByRows } from "@/shared/hooks/use-visible-by-rows";
import type { Product } from "@/types";

const NEW_ARRIVALS_HREF = browsePath({ sort: "newest" });
const NEW_ARRIVALS_ROWS = 2;

export function NewArrivalsSection({
  products,
  total,
  loading,
}: {
  products: Product[];
  total: number;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const { openProduct } = useBz();
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleCount = useVisibleByRows(gridRef, NEW_ARRIVALS_ROWS);
  const visibleProducts = products.slice(0, visibleCount);
  const showBrowseAll = total > visibleCount;

  if (!loading && products.length === 0) return null;

  return (
    <>
      <SectionHead
        title={t("home.newArrivals")}
        action={showBrowseAll ? t("home.browseAll") : undefined}
        actionHref={showBrowseAll ? NEW_ARRIVALS_HREF : undefined}
      />
      <div className="bz-picks-grid" ref={gridRef}>
        {loading
          ? Array.from({ length: visibleCount }).map((_, i) => <SkeletonCard key={i} />)
          : visibleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                p={product}
                onClick={openProduct}
                source={{ page: "home", section: "new_arrivals", position: index + 1 }}
              />
            ))}
      </div>
    </>
  );
}
