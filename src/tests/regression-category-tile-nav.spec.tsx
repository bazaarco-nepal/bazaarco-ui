import React from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";

// BazaarProvider relies on the automatic JSX runtime (no `import React`), but the
// vitest transform compiles its JSX to classic `React.createElement`. Expose
// React on the global so that unqualified reference resolves during the test.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: clicking a category (e.g. a home "Shop by Category" tile) did not
// take the buyer to that category's results. Two bugs in BazaarProvider.nav:
//
//   1. It set screenOverride = "browse" but pushed to /search?cat=...  The render
//      screen is `screenOverride ?? routeScreen`, and the override only clears
//      when routeScreen === screenOverride. "browse" never equals the /search
//      route's "search", so the override stuck and <Browse /> rendered at
//      /search — which, without ?view=categories, is just an infinite spinner.
//   2. It folded the current store `query` into the URL, so a stale search term
//      (e.g. "shoes" from an earlier search) produced /search?q=shoes&cat=x —
//      results filtered by BOTH, not "only that category by relevance".
//
// Fix: for a category nav, clear the query, omit `q` from the URL, and set the
// override to "search" so the faceted Search screen renders and the override
// clears once the URL catches up.
//
// This test drives the REAL nav via the real provider and asserts the pushed
// URL is /search?cat=electronics (no q) and the override is "search".

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(""),
}));

// The provider pulls in a lot of data hooks; stub them to inert values so the
// only behaviour under test is nav().
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
}));
vi.mock("@/shared/hooks/use-auth", () => ({
  useCurrentUser: () => ({ isFetched: true, isError: false, data: null }),
}));
vi.mock("@/buyer/hooks/use-cart", () => ({
  useCartQuery: () => ({ isLoading: false, isFetching: false }),
  useCartMutations: () => ({ addItem: {}, updateQty: {}, removeItem: {} }),
}));
vi.mock("@/buyer/hooks/use-saved", () => ({
  useSavedQuery: () => ({}),
  useSavedMutations: () => ({
    addProduct: {},
    removeProduct: {},
    addSeller: {},
    removeSeller: {},
  }),
}));
vi.mock("@/shared/hooks/use-catalog", () => ({
  useProduct: () => ({ data: null }),
}));

import { BazaarProvider } from "@/providers/bazaar-provider";
import { useBz } from "@/components/common";
import { useBazaarStore } from "@/store/bazaar-store";

let nav: ReturnType<typeof useBz>["nav"];
function Capture() {
  nav = useBz().nav;
  return null;
}

beforeEach(() => {
  push.mockClear();
  useBazaarStore.getState().setQuery("");
  useBazaarStore.getState().setScreenOverride(null);
});

it("clicking a category navigates to only that category (no stale query, relevance default)", () => {
  // Buyer searched earlier; the term lingers in the store while on the homepage.
  act(() => {
    useBazaarStore.getState().setQuery("shoes");
  });

  render(
    <BazaarProvider>
      <Capture />
    </BazaarProvider>,
  );

  act(() => {
    nav("browse", { cat: "electronics" });
  });

  // Only the category — no q, no sort (relevance is the omitted default).
  expect(push).toHaveBeenCalledWith("/search?cat=electronics");
  // The stale term is cleared so the navbar box doesn't show it on the results page.
  expect(useBazaarStore.getState().query).toBe("");
});

it("sets the screen override to 'search' so the faceted screen renders (not a stuck Browse spinner)", () => {
  render(
    <BazaarProvider>
      <Capture />
    </BazaarProvider>,
  );

  act(() => {
    nav("browse", { cat: "electronics" });
  });

  expect(useBazaarStore.getState().screenOverride).toBe("search");
});
