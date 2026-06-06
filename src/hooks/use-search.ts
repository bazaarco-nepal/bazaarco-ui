"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi, type SearchParams } from "@/services/api/search";

export function useSearch(params: SearchParams | null) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: () => searchApi.search(params!),
    // Enabled whenever params are provided — an empty query browses everything
    // (faceted /search page). Callers that want it idle pass null (e.g. /browse).
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
