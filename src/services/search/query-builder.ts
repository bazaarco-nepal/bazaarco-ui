import type { FacetFilters, NumericFilters, SearchQuery } from "algoliasearch";

const HIGHLIGHT_TAGS = { highlightPreTag: "<mark>", highlightPostTag: "</mark>" } as const;

const MAX_FACET_VALUES = 100;

export interface SearchCriteria {
  query: string;
  sort: "" | "price:asc" | "price:desc" | "rating:desc" | "created:desc";
  categories: string[];
  sellers: string[];
  verified?: boolean;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  page: number;
  perPage: number;
}

interface IndexTargets {
  mainIndex: string;
  facetIndex: string;
}

const categoryDisjunction = (categories: string[]): string[] | null =>
  categories.length ? categories.map((value) => `category:${value}`) : null;

const sellerDisjunction = (sellers: string[]): string[] | null =>
  sellers.length ? sellers.map((value) => `seller_name:${value}`) : null;

function buildFacetFilters(
  criteria: SearchCriteria,
  include: { category: boolean; seller: boolean },
): FacetFilters {
  const facetFilters: (string | string[])[] = [];

  if (include.category) {
    const group = categoryDisjunction(criteria.categories);
    if (group) facetFilters.push(group);
  }
  if (include.seller) {
    const group = sellerDisjunction(criteria.sellers);
    if (group) facetFilters.push(group);
  }
  if (criteria.verified) facetFilters.push("seller_verified:true");

  return facetFilters;
}

export function buildNumericFilters(criteria: SearchCriteria): NumericFilters {
  const numericFilters: string[] = [];

  if (criteria.priceMin !== undefined) numericFilters.push(`price>=${criteria.priceMin}`);
  if (criteria.priceMax !== undefined) numericFilters.push(`price<=${criteria.priceMax}`);
  if (criteria.rating !== undefined) numericFilters.push(`rating>=${criteria.rating}`);

  return numericFilters;
}

export function buildSearchRequests(
  criteria: SearchCriteria,
  indices: IndexTargets,
): SearchQuery[] {
  const numericFilters = buildNumericFilters(criteria);
  const sharedParams = {
    query: criteria.query,
    ...(numericFilters.length ? { numericFilters } : {}),
    ...HIGHLIGHT_TAGS,
  };

  return [
    {
      indexName: indices.mainIndex,
      ...sharedParams,
      facetFilters: buildFacetFilters(criteria, { category: true, seller: true }),
      page: criteria.page - 1,
      hitsPerPage: criteria.perPage,
    },
    {
      indexName: indices.facetIndex,
      ...sharedParams,
      facetFilters: buildFacetFilters(criteria, { category: false, seller: true }),
      facets: ["category"],
      maxValuesPerFacet: MAX_FACET_VALUES,
      hitsPerPage: 0,
    },
    {
      indexName: indices.facetIndex,
      ...sharedParams,
      facetFilters: buildFacetFilters(criteria, { category: true, seller: false }),
      facets: ["seller_name"],
      maxValuesPerFacet: MAX_FACET_VALUES,
      hitsPerPage: 0,
    },
  ];
}
