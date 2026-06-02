"use client";

import { useRouter } from "next/navigation";
import { Button, SectionHead, SkeletonCard } from "@/components/ui";
import { ProductCard, useBz } from "@/components/common";
import { useNewArrivals, useTopPicks } from "@/hooks/use-catalog";
import type { Product } from "@/types";

type PicksQuery = ReturnType<typeof useTopPicks>;

function ProductSection({
  title,
  query,
  seeAllHref,
  hideWhenEmpty = false,
}: {
  title: string;
  query: PicksQuery;
  seeAllHref: string;
  hideWhenEmpty?: boolean;
}) {
  const { openProduct } = useBz();
  const router = useRouter();

  const items: Product[] = (query.data?.pages ?? []).flatMap((p) => p.items);
  const isLoading = query.isLoading;

  // Hide section entirely (no heading, no empty state) once load settles with no items.
  if (hideWhenEmpty && !isLoading && items.length === 0) return null;

  return (
    <section
      className="bz-container-pad bz-home-section"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 28px", paddingTop: 36 }}
    >
      <SectionHead title={title} action="See All" onAction={() => router.push(seeAllHref)} />

      <div className="bz-picks-grid">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((p) => <ProductCard key={p.id} p={p} onClick={openProduct} />)}
      </div>

      {!isLoading && items.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--ink-400)", padding: "32px 0" }}>
          Nothing here yet.
        </div>
      )}

      {query.hasNextPage && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <Button
            variant="secondary"
            size="sm"
            iconRight="chevronDown"
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </section>
  );
}

export function PicksSections() {
  const topPicks = useTopPicks(7);
  const newArrivals = useNewArrivals();

  return (
    <>
      <ProductSection
        title="Top Picks"
        query={topPicks}
        seeAllHref="/browse?sort=popular"
        hideWhenEmpty
      />
      <ProductSection title="New Arrivals" query={newArrivals} seeAllHref="/browse?sort=newest" />
    </>
  );
}
