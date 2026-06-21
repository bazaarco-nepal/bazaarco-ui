import type { Facet, SearchFacets } from "@/buyer/api/search";

export interface AlgoliaResult {
  hits?: Record<string, unknown>[];
  nbHits?: number;
  processingTimeMS?: number;
  facets?: Record<string, Record<string, number>>;
}

interface FacetCount {
  field_name: string;
  counts: { value: string; count: number }[];
}

interface SearchEnvelope {
  found: number;
  search_time_ms: number;
  page: number;
  per_page: number;
  facet_counts: FacetCount[];
  hits: { document: Record<string, unknown>; highlight?: { name?: { snippet: string } } }[];
}

function toFacetCount(fieldName: string, facets: AlgoliaResult["facets"]): FacetCount {
  const valueCounts = facets?.[fieldName] ?? {};
  const counts = Object.entries(valueCounts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
  return { field_name: fieldName, counts };
}

export function toSearchEnvelope(
  results: AlgoliaResult[],
  page: number,
  perPage: number,
): SearchEnvelope {
  const [hitsResult, categoryResult, sellerResult] = results;

  return {
    found: hitsResult?.nbHits ?? 0,
    search_time_ms: hitsResult?.processingTimeMS ?? 0,
    page,
    per_page: perPage,
    facet_counts: [
      toFacetCount("category", categoryResult?.facets),
      toFacetCount("seller_name", sellerResult?.facets),
    ],
    hits: (hitsResult?.hits ?? []).map((record) => {
      const highlightedName = (record as { _highlightResult?: { name?: { value?: string } } })
        ._highlightResult?.name?.value;
      return {
        document: record,
        ...(highlightedName ? { highlight: { name: { snippet: highlightedName } } } : {}),
      };
    }),
  };
}

function mapFacetList(field: string, facetCounts: FacetCount[]): Facet[] {
  return (
    facetCounts
      .find((f) => f.field_name === field)
      ?.counts.map((c) => ({ value: c.value, count: c.count })) ?? []
  );
}

export function toSearchFacets(facetCounts: FacetCount[]): SearchFacets {
  return {
    categories: mapFacetList("category", facetCounts),
    sellers: mapFacetList("seller_name", facetCounts),
  };
}
