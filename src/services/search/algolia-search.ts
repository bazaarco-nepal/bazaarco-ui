import type { SearchParams, SearchResponse } from "@/services/api/search";
import {
  algoliaSearchClient,
  isAlgoliaConfigured,
  primaryIndexName,
  resolveSortIndex,
  type AlgoliaSort,
} from "./algolia-client";
import { buildSearchRequests } from "./query-builder";
import { toSearchProductHit } from "./hit-mapper";
import { toSearchEnvelope, toSearchFacets } from "./response-mapper";

const SORT_MAP: Record<NonNullable<SearchParams["sort"]>, AlgoliaSort> = {
  relevance: "",
  price_low: "price:asc",
  price_high: "price:desc",
  rating: "rating:desc",
};

/** UI price filters are in rupees; Algolia stores minor units (paise). */
function toMinorUnits(rupees: number | undefined): number | undefined {
  return rupees === undefined ? undefined : Math.round(rupees * 100);
}

function toCriteria(params: SearchParams) {
  const rating = params.rating ?? (params.rating4 ? 4 : undefined);
  return {
    query: params.query ?? "",
    sort: SORT_MAP[params.sort ?? "relevance"],
    categories: params.categories ?? [],
    sellers: params.sellers ?? [],
    priceMin: toMinorUnits(params.price_min),
    priceMax: toMinorUnits(params.price_max),
    rating,
    page: params.page ?? 1,
    perPage: params.limit ?? 24,
  };
}

export async function algoliaSearch(params: SearchParams): Promise<SearchResponse> {
  if (!isAlgoliaConfigured()) {
    throw new Error("Algolia is not configured (set NEXT_PUBLIC_ALGOLIA_* env vars)");
  }

  const criteria = toCriteria(params);
  const requests = buildSearchRequests(criteria, {
    mainIndex: resolveSortIndex(criteria.sort),
    facetIndex: primaryIndexName,
  });

  const { results } = await algoliaSearchClient.search<Record<string, unknown>>({ requests });
  const envelope = toSearchEnvelope(results, criteria.page, criteria.perPage);

  return {
    query: params.query,
    page: criteria.page,
    limit: criteria.perPage,
    total: envelope.found,
    page_count: Math.ceil(envelope.found / criteria.perPage),
    search_time_ms: envelope.search_time_ms,
    facets: toSearchFacets(envelope.facet_counts),
    items: envelope.hits.map((hit) => toSearchProductHit(hit.document)),
  };
}
