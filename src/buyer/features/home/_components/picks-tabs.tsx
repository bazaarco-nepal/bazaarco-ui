"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, SectionHead, SkeletonCard } from "@/components/ui";
import { ProductCard, useBz } from "@/components/common";
import { catalogApi } from "@/shared/api/catalog";
import type { PaginatedData } from "@/shared/api/types";
import type { Product } from "@/types";

const PICKS_PAGE_SIZE = 12;

function ProductSection({
  title,
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  seeAllHref,
  hideWhenEmpty = false,
}: {
  title: string;
  items: Product[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  seeAllHref?: string;
  hideWhenEmpty?: boolean;
}) {
  const { t } = useTranslation();
  const { openProduct } = useBz();
  const router = useRouter();

  if (hideWhenEmpty && items.length === 0) return null;

  return (
    <section className="container bz-home-section">
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

      {hasNextPage && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <Button
            variant="secondary"
            size="sm"
            iconRight="chevronDown"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage ? "…" : t("common.loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}

function usePaginatedSection(initial?: PaginatedData<Product>) {
  const [items, setItems] = useState<Product[]>(initial?.items ?? []);
  const [page, setPage] = useState(initial?.page ?? 1);
  const [hasNextPage, setHasNextPage] = useState(
    Boolean(initial && initial.page < initial.totalPages),
  );
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setItems(initial.items);
    setPage(initial.page);
    setHasNextPage(initial.page < initial.totalPages);
  }, [initial]);

  const loadMore = useCallback(
    async (fetchPage: (page: number) => Promise<PaginatedData<Product>>) => {
      if (!hasNextPage || isFetchingNextPage) return;
      setIsFetchingNextPage(true);
      try {
        const next = await fetchPage(page + 1);
        setItems((current) => [...current, ...next.items]);
        setPage(next.page);
        setHasNextPage(next.page < next.totalPages);
      } finally {
        setIsFetchingNextPage(false);
      }
    },
    [hasNextPage, isFetchingNextPage, page],
  );

  return {
    items,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    isLoading: !initial,
  };
}

export function PicksSections({
  topPicks: topPicksInitial,
  homeLoading,
}: {
  topPicks?: PaginatedData<Product>;
  homeLoading: boolean;
}) {
  const { t } = useTranslation();
  const topPicks = usePaginatedSection(topPicksInitial);

  return (
    <>
      <ProductSection
        title={t("home.topPicks")}
        items={topPicks.items}
        isLoading={homeLoading && topPicks.items.length === 0}
        hasNextPage={topPicks.hasNextPage}
        isFetchingNextPage={topPicks.isFetchingNextPage}
        onLoadMore={() =>
          topPicks.loadMore((page) =>
            catalogApi.getTopPicks({ days: 7, page, limit: PICKS_PAGE_SIZE }),
          )
        }
        seeAllHref="/browse?sort=popular"
        hideWhenEmpty
      />
    </>
  );
}
