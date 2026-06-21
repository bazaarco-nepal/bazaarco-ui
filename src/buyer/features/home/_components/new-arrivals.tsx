"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, SkeletonCard } from "@/components/ui";
import { browsePath } from "@/config/routes";
import { ProductCard, useBz } from "@/components/common";
import { useGridColumns } from "@/shared/hooks/use-visible-by-rows";
import type { Product } from "@/types";

const NEW_ARRIVALS_HREF = browsePath({ sort: "newest" });
const COMPACT_ROW_TARGET = 150;
const DEFAULT_COMPACT_ROWS = 3;

function NewArrivalsHead({
  compact = false,
  count,
  action,
}: {
  compact?: boolean;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="bz-arrivals__head">
      <div>
        <h2 className="bz-arrivals__title">New Arrivals</h2>
      </div>
      {action ??
        (!compact && typeof count === "number" && count > 0 && (
          <span className="bz-arrivals__count tnum">{count} products</span>
        ))}
    </div>
  );
}

export function NewArrivalsRail({ products, loading }: { products: Product[]; loading: boolean }) {
  const { openProduct } = useBz();
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useGridColumns(gridRef);
  const [rows, setRows] = useState(DEFAULT_COMPACT_ROWS);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const measureRows = () => {
      const availableHeight = grid.clientHeight;
      const nextRows = Math.max(1, Math.min(4, Math.round(availableHeight / COMPACT_ROW_TARGET)));
      setRows(nextRows || DEFAULT_COMPACT_ROWS);
    };

    measureRows();
    const observer = new ResizeObserver(measureRows);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [cols]);

  const visibleProducts = useMemo(
    () => products.slice(0, Math.max(1, cols) * rows),
    [cols, products, rows],
  );
  const loadingCount = Math.max(1, cols) * rows;

  return (
    <aside className="bz-arrivals-rail" aria-label="New arrivals">
      <NewArrivalsHead
        action={
          <Button variant="link" href={NEW_ARRIVALS_HREF} iconRight="arrowRight">
            Browse all
          </Button>
        }
      />
      <div ref={gridRef} className="bz-arrivals-rail__grid">
        {loading
          ? Array.from({ length: loadingCount }).map((_, i) => <SkeletonCard key={i} />)
          : visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                p={product}
                onClick={openProduct}
                savable={false}
                variant="compact"
              />
            ))}
      </div>
    </aside>
  );
}

export function NewArrivalsMobile({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) {
  const { openProduct } = useBz();

  return (
    <section className="bz-arrivals-mobile" aria-label="New arrivals">
      <div className="bz-arrivals-mobile__head">
        <NewArrivalsHead compact />
        <Button
          variant="link"
          href={NEW_ARRIVALS_HREF}
          iconRight="arrowRight"
          style={{ marginLeft: "auto" }}
        >
          All
        </Button>
      </div>
      <div className="bz-arrivals-mobile__grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((product) => (
              <ProductCard
                key={product.id}
                p={product}
                onClick={openProduct}
                savable={false}
                variant="compact"
              />
            ))}
      </div>
    </section>
  );
}
