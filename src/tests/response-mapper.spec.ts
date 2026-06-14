import { describe, expect, it } from "vitest";

import { toSearchDocument } from "@/services/search/hit-mapper";
import type { AlgoliaResult } from "@/services/search/response-mapper";
import { toSearchEnvelope } from "@/services/search/response-mapper";

describe("toSearchDocument", () => {
  it("surfaces objectID as id and defaults missing fields", () => {
    const document = toSearchDocument({ objectID: "abc", name: "Lamp", price: 1200 });
    expect(document.id).toBe("abc");
    expect(document.name).toBe("Lamp");
    expect(document.price).toBe(1200);
    expect(document.description).toBe("");
    expect(document.seller_verified).toBe(false);
    expect(document.reviews_count).toBe(0);
  });
});

describe("toSearchEnvelope", () => {
  it("recombines the disjunctive batch into the search envelope", () => {
    const results: AlgoliaResult[] = [
      {
        nbHits: 42,
        processingTimeMS: 7,
        hits: [
          {
            objectID: "p1",
            name: "Phone",
            seller_name: "Acme",
            category: "electronics",
            price: 9999,
            rating: 4.5,
            _highlightResult: { name: { value: "Smart <mark>Phone</mark>" } },
          },
        ],
      },
      { facets: { category: { electronics: 30, fashion: 12 } } },
      { facets: { seller_name: { Acme: 5, Beta: 9 } } },
    ];

    const envelope = toSearchEnvelope(results, 2, 9);

    expect(envelope.found).toBe(42);
    expect(envelope.search_time_ms).toBe(7);
    expect(envelope.page).toBe(2);
    expect(envelope.hits[0]!.highlight?.name?.snippet).toBe("Smart <mark>Phone</mark>");

    const categoryFacet = envelope.facet_counts.find((f) => f.field_name === "category");
    expect(categoryFacet?.counts[0]).toEqual({ value: "electronics", count: 30 });
  });
});
