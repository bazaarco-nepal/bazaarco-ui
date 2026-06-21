"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/buyer/api/search";
import { algoliaSearch } from "@/services/search/algolia-search";
import { catalogBrowse } from "@/services/search/catalog-browse";
import type { SearchParams } from "@/buyer/api/search";

/**
 * The single product-listing hook. A typed query goes to Algolia (its
 * typo-tolerance/relevance is worth the cost); everything query-less is served
 * from Postgres via the faceted catalog browse, so plain browsing/filtering/
 * sorting never spends an Algolia search op. Both return the same envelope.
 */
export function useProductListing(params: SearchParams | null) {
  return useQuery({
    queryKey: ["listing", params],
    queryFn: () => {
      const p = params!;
      return p.query?.trim() ? algoliaSearch(p) : catalogBrowse(p);
    },
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
