import { describe, it, expect } from "vitest";
import { browsePath, searchPath, searchSortFromBrowseParam } from "@/config/routes";

// REGRESSION: /browse?sort=newest once loaded an infinite spinner, then briefly
// lived as a separate catalog-backed page. Both are gone — the newest listing is
// now just a sort on the single faceted /search page (backed by the Algolia
// `_created_desc` replica), so every product listing shares one engine + one UI.
//
// Invariant locked here: the "newest" entry points all resolve to /search, and
// "newest" survives the browse→search sort mapping (so the URL isn't silently
// downgraded to relevance the way it used to be).

it("the New Arrivals 'See all' link resolves to the unified search page", () => {
  expect(browsePath({ sort: "newest" })).toBe("/search?sort=newest");
});

it("searchPath preserves the newest sort", () => {
  expect(searchPath({ sort: "newest" })).toBe("/search?sort=newest");
});

it("newest is a first-class search sort, not remapped to relevance", () => {
  expect(searchSortFromBrowseParam("newest")).toBe("newest");
});

describe("only the category browser stays on /browse", () => {
  it("keeps ?view=categories on /browse, everything else goes to /search", () => {
    expect(browsePath({ view: "categories" })).toBe("/browse?view=categories");
    expect(browsePath({ q: "laptop" })).toBe("/search?q=laptop");
    expect(browsePath({ cat: ["mobile-phones-tablets"], sort: "newest" })).toBe(
      "/search?cat=mobile-phones-tablets&sort=newest",
    );
  });
});
