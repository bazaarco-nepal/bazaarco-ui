"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { catalogApi } from "@/shared/api/catalog";
import type { PaginatedData } from "@/shared/api/types";
import type { Product } from "@/types";

// 21 = a clean 3 rows at the common 7-up width; the grid renders only whole rows
// for narrower column counts, so the page size just sets how much each fetch adds.
const EXPLORE_PAGE_SIZE = 21;

// Mobile feed auto-loads its first 3 pages (~63 products) on scroll, then hands
// off to the manual "Load More" button — frictionless discovery up front without
// the lag/footer-blocking of unbounded infinite scroll deeper in.
export const EXPLORE_AUTOLOAD_MAX_PAGES = 3;

export function useHomeExploreFeed(initial?: PaginatedData<Product>) {
  const [items, setItems] = useState<Product[]>(initial?.items ?? []);
  const [page, setPage] = useState(initial?.page ?? 1);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [totalPages, setTotalPages] = useState(initial?.totalPages ?? 0);
  const [hasNextPage, setHasNextPage] = useState(
    Boolean(initial && initial.page < initial.totalPages),
  );
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setItems(initial.items);
    setPage(initial.page);
    setTotal(initial.total);
    setTotalPages(initial.totalPages);
    setHasNextPage(initial.page < initial.totalPages);
  }, [initial]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const next = await catalogApi.getProducts({ page: page + 1, limit: EXPLORE_PAGE_SIZE });
      setItems((current) => [...current, ...next.items]);
      setPage(next.page);
      setTotal(next.total);
      setTotalPages(next.totalPages);
      setHasNextPage(next.page < next.totalPages);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNextPage, isFetchingNextPage, page]);

  const inStock = useMemo(() => items.filter((p) => !p.outOfStock), [items]);

  return {
    items: inStock,
    total,
    totalPages,
    page,
    pageSize: EXPLORE_PAGE_SIZE,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    isLoading: !initial,
  };
}
