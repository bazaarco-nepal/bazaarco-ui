import { catalogApi } from "@/shared/api/catalog";
import type { SearchParams, SearchResponse } from "@/buyer/api/search";

/** Query-less listing served from Postgres (no Algolia op). Maps the catalog
 *  browse response into the same SearchResponse envelope the search path returns,
 *  so the listing page renders identically regardless of source. */
export async function catalogBrowse(params: SearchParams): Promise<SearchResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 24;
  const data = await catalogApi.browseProducts({
    categories: params.categories,
    sellers: params.sellers,
    price_min: params.price_min,
    price_max: params.price_max,
    rating: params.rating ?? (params.rating4 ? 4 : undefined),
    sort: params.sort,
    page,
    limit,
  });

  return {
    query: "",
    page: data.page,
    limit: data.limit,
    total: data.total,
    page_count: data.totalPages,
    facets: data.facets ?? { categories: [], sellers: [] },
    items: data.items,
  };
}
