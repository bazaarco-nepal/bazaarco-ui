import { describe, expect, it } from "vitest";

import { buildNumericFilters, buildSearchRequests } from "@/services/search/query-builder";

const baseCriteria = {
  query: "",
  sort: "" as const,
  categories: [] as string[],
  sellers: [] as string[],
  verified: undefined,
  priceMin: undefined,
  priceMax: undefined,
  rating: undefined,
  page: 1,
  perPage: 9,
};

describe("buildNumericFilters", () => {
  it("builds price-range and rating filters", () => {
    const filters = buildNumericFilters({
      ...baseCriteria,
      priceMin: 100,
      priceMax: 500,
      rating: 4,
    });
    expect(filters).toEqual(["price>=100", "price<=500", "rating>=4"]);
  });

  it("omits filters that are not set", () => {
    expect(buildNumericFilters(baseCriteria)).toEqual([]);
  });
});

describe("buildSearchRequests", () => {
  const indices = { mainIndex: "products_price_asc", facetIndex: "products" };

  it("emits a 3-request disjunctive batch", () => {
    const requests = buildSearchRequests({ ...baseCriteria, sort: "price:asc" }, indices);
    expect(requests).toHaveLength(3);

    const [hits, categoryFacets, sellerFacets] = requests;
    expect(hits.indexName).toBe("products_price_asc");
    expect((hits as { page?: number }).page).toBe(0);
    expect((hits as { hitsPerPage?: number }).hitsPerPage).toBe(9);
    expect((categoryFacets as { facets?: string[] }).facets).toEqual(["category"]);
    expect((sellerFacets as { facets?: string[] }).facets).toEqual(["seller_name"]);
  });

  it("uses disjunctive faceting constraints", () => {
    const criteria = {
      ...baseCriteria,
      categories: ["electronics"],
      sellers: ["Acme"],
      verified: true,
    };
    const [hits, categoryFacets, sellerFacets] = buildSearchRequests(criteria, indices);

    expect((hits as { facetFilters?: unknown }).facetFilters).toEqual([
      ["category:electronics"],
      ["seller_name:Acme"],
      "seller_verified:true",
    ]);
    expect((categoryFacets as { facetFilters?: unknown }).facetFilters).toEqual([
      ["seller_name:Acme"],
      "seller_verified:true",
    ]);
    expect((sellerFacets as { facetFilters?: unknown }).facetFilters).toEqual([
      ["category:electronics"],
      "seller_verified:true",
    ]);
  });
});
