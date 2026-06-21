"use client";

import type { ReactNode } from "react";
import { Button, SkeletonCard } from "@/components/ui";
import { searchPath } from "@/config/routes";
import { ProductCard, useBz } from "@/components/common";
import type { Product } from "@/types";

const NEW_ARRIVALS_HREF = searchPath();

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

  return (
    <aside className="bz-arrivals-rail" aria-label="New arrivals">
      <NewArrivalsHead
        action={
          <Button variant="link" href={NEW_ARRIVALS_HREF} iconRight="arrowRight">
            Browse new arrivals
          </Button>
        }
      />
      <div className="bz-arrivals-rail__grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((product) => (
              <ProductCard key={product.id} p={product} onClick={openProduct} savable={false} />
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
              <ProductCard key={product.id} p={product} onClick={openProduct} savable={false} />
            ))}
      </div>
    </section>
  );
}
