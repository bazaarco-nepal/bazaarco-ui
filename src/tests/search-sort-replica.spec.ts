import { describe, it, expect, beforeAll } from "vitest";

// The newest sort is served by a dedicated Algolia replica ranked on created_at
// (`<index>_created_desc`). This locks the sort -> index wiring: if it ever
// silently fell back to the primary index, "newest" would quietly return
// relevance-ordered results with no error.
//
// algolia-client builds the search client at import time, so stub the public
// env vars and import dynamically (mirrors how the app is configured in prod).

type ClientModule = typeof import("@/services/search/algolia-client");
let mod: ClientModule;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID = "test_app";
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY = "test_key";
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME = "ProductIndex";
  mod = await import("@/services/search/algolia-client");
});

describe("newest sort resolves to its own replica", () => {
  it("created:desc maps to the _created_desc replica", () => {
    expect(mod.resolveSortIndex("created:desc")).toBe(mod.replicaIndexNames.createdDesc);
    expect(mod.replicaIndexNames.createdDesc).toBe(`${mod.primaryIndexName}_created_desc`);
  });

  it("each sort still targets its own index; relevance stays on primary", () => {
    expect(mod.resolveSortIndex("")).toBe(mod.primaryIndexName);
    expect(mod.resolveSortIndex("rating:desc")).toBe(mod.replicaIndexNames.ratingDesc);
    expect(mod.resolveSortIndex("price:asc")).toBe(mod.replicaIndexNames.priceAsc);
    expect(mod.resolveSortIndex("price:desc")).toBe(mod.replicaIndexNames.priceDesc);
  });
});
