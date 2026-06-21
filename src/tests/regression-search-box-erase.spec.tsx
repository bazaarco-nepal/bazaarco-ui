import React from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";

// REGRESSION: on the search results page (/browse?q=...) the search box could
// not be edited or erased — backspace / Ctrl+A / the clear button all "did
// nothing", because the typed value snapped straight back to the URL's `q`.
//
// Cause: browse.tsx had a sync effect
//   useEffect(() => { if (urlQuery && urlQuery !== query) setQuery(urlQuery); },
//            [urlQuery, query, setQuery]);
// With `query` in its deps, EVERY keystroke that diverged from the URL re-ran
// the effect and reverted the store back to `urlQuery`. The buyer had to leave
// for the homepage (where urlQuery is empty) just to clear the box.
//
// Fix: remove that duplicate effect. The URL -> store sync on navigation lives
// in BazaarProvider with deps [pathname, urlQuery, setQuery] (no `query`), so it
// runs once per navigation and never fights live edits.
//
// This test renders the REAL Browse with the URL pinned to ?q=shoes, simulates a
// keystroke that diverges from the URL, and asserts the store value is NOT
// reverted. It fails against the pre-fix browse.tsx and passes after.

// Stable identities: Browse memoizes on these references, so returning a fresh
// object each render would loop forever (setCats from a new array every render).
vi.mock("next/navigation", () => {
  const params = new URLSearchParams("q=shoes");
  const router = { push: vi.fn(), replace: vi.fn() };
  return {
    useRouter: () => router,
    usePathname: () => "/browse",
    useSearchParams: () => params,
  };
});

vi.mock("@/shared/hooks/use-catalog", () => ({
  useCatalog: () => ({
    products: [],
    categories: [],
    sellers: {},
    categoryAttributes: {},
    isLoading: false,
    isError: false,
    error: null,
    byId: () => undefined,
    sellerOf: () => undefined,
    inCat: () => [],
    videoProducts: () => [],
    flashProducts: () => [],
  }),
}));

vi.mock("@/buyer/hooks/use-search", () => ({
  useProductListing: () => ({ data: null, isLoading: false, isFetching: false }),
  useSimilar: () => ({ data: undefined, isLoading: false }),
}));

import { BazaarCtx } from "@/components/common";
import { Browse } from "@/buyer/features/browse/browse";
import { useBazaarStore } from "@/store/bazaar-store";

// Minimal context backed by the REAL store so Browse's setQuery writes it and
// `query` updates reactively — exactly the navbar <-> browse seam.
function Harness() {
  const query = useBazaarStore((s) => s.query);
  const setQuery = useBazaarStore((s) => s.setQuery);
  const value = {
    query,
    setQuery,
    openProduct: vi.fn(),
    nav: vi.fn(),
  } as unknown as React.ContextType<typeof BazaarCtx>;
  return (
    <BazaarCtx.Provider value={value}>
      <Browse />
    </BazaarCtx.Provider>
  );
}

beforeEach(() => {
  useBazaarStore.getState().setQuery("");
});

it("keystrokes in the search box are not reverted to the URL's q on the results page", () => {
  render(<Harness />);

  // The buyer edits the box (e.g. backspacing "shoes" -> "shoe").
  act(() => {
    useBazaarStore.getState().setQuery("shoe");
  });

  expect(useBazaarStore.getState().query).toBe("shoe");
});

it("the search box can be fully cleared on the results page (× clear button)", () => {
  render(<Harness />);

  act(() => {
    useBazaarStore.getState().setQuery("");
  });

  expect(useBazaarStore.getState().query).toBe("");
});
