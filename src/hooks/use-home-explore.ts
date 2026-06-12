"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { catalogApi } from "@/services/api/catalog";
import type { PaginatedData } from "@/services/api/types";
import type { Product } from "@/types";

const EXPLORE_PAGE_SIZE = 20;

export function useHomeExploreFeed(initial?: PaginatedData<Product>) {
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

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    setIsFetchingNextPage(true);
    try {
      const next = await catalogApi.getProducts({ page: page + 1, limit: EXPLORE_PAGE_SIZE });
      setItems((current) => [...current, ...next.items]);
      setPage(next.page);
      setHasNextPage(next.page < next.totalPages);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [hasNextPage, isFetchingNextPage, page]);

  const inStock = useMemo(() => items.filter((p) => !p.outOfStock), [items]);

  return {
    items: inStock,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    isLoading: !initial,
  };
}
