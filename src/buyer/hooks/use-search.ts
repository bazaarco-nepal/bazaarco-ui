"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/buyer/api/search";
import { algoliaSearch } from "@/services/search/algolia-search";
import type { SearchParams } from "@/buyer/api/search";

export function useSearch(params: SearchParams | null) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: () => algoliaSearch(params!),
    enabled: params !== null,
    staleTime: 60_000,
  });
}

/** Vector "find similar" products for a given product id (powers the PDP rail). */
export function useSimilar(productId: string | null, limit = 10) {
  return useQuery({
    queryKey: ["search", "similar", productId, limit],
    queryFn: () => searchApi.similar(productId!, limit),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}
