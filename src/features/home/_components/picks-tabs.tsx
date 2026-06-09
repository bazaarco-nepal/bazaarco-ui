"use client";

import { useTranslation } from "react-i18next";
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
  seeAllHref?: string;
  hideWhenEmpty?: boolean;
}) {
  const { t } = useTranslation();
  const { openProduct } = useBz();
  const router = useRouter();

  const items: Product[] = (query.data?.pages ?? []).flatMap((p) => p.items);
  const isLoading = query.isLoading;

  // Hide section entirely whenever it has no items — including while loading, so a
  // possibly-empty section never flashes a skeleton that then vanishes. It pops in
  // only once items actually arrive; if none ever do, it stays invisible.
  if (hideWhenEmpty && items.length === 0) return null;

  return (
    <section
      className="bz-container-pad bz-home-section"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 28px", paddingTop: 36 }}
    >
      <SectionHead
        title={title}
        action={seeAllHref ? t("common.seeAll") : undefined}
        onAction={seeAllHref ? () => router.push(seeAllHref) : undefined}
      />

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
            {query.isFetchingNextPage ? "…" : t("common.loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}

export function PicksSections() {
  const { t } = useTranslation();
  const topPicks = useTopPicks(7);
  const newArrivals = useNewArrivals();

  return (
    <>
      <ProductSection title={t("home.newArrivals")} query={newArrivals} />
      <ProductSection
        title={t("home.topPicks")}
        query={topPicks}
        seeAllHref="/browse?sort=popular"
        hideWhenEmpty
      />
    </>
  );
}
