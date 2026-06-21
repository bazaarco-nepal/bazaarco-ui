import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SearchResponse } from "@/buyer/api/search";

// COST GUARD: Algolia is billed per search op, so only a typed query may hit it.
// Every query-less listing (browse all, category/seller/price/rating filters,
// newest + price/rating sorts, pagination) must be served from Postgres via
// catalogBrowse. This locks that routing so a refactor can't silently send
// browsing traffic back to Algolia.

const empty: SearchResponse = {
  query: "",
  page: 1,
  limit: 24,
  total: 0,
  page_count: 1,
  facets: { categories: [], sellers: [] },
  items: [],
};

vi.mock("@/services/search/algolia-search", () => ({
  algoliaSearch: vi.fn(() => Promise.resolve(empty)),
}));
vi.mock("@/services/search/catalog-browse", () => ({
  catalogBrowse: vi.fn(() => Promise.resolve(empty)),
}));

import { algoliaSearch } from "@/services/search/algolia-search";
import { catalogBrowse } from "@/services/search/catalog-browse";
import { useProductListing } from "@/buyer/hooks/use-search";

const algolia = algoliaSearch as unknown as ReturnType<typeof vi.fn>;
const catalog = catalogBrowse as unknown as ReturnType<typeof vi.fn>;

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  algolia.mockClear();
  catalog.mockClear();
});

describe("product listing engine routing", () => {
  it("query-less browse goes to Postgres, never Algolia", async () => {
    const { result } = renderHook(
      () => useProductListing({ query: "", sort: "newest", categories: ["fashion-clothing"] }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(catalog).toHaveBeenCalledTimes(1);
    expect(algolia).not.toHaveBeenCalled();
  });

  it("a whitespace-only query is still treated as query-less (Postgres)", async () => {
    const { result } = renderHook(() => useProductListing({ query: "   " }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(catalog).toHaveBeenCalledTimes(1);
    expect(algolia).not.toHaveBeenCalled();
  });

  it("a typed query goes to Algolia, never Postgres", async () => {
    const { result } = renderHook(() => useProductListing({ query: "water bottle" }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(algolia).toHaveBeenCalledTimes(1);
    expect(catalog).not.toHaveBeenCalled();
  });
});
