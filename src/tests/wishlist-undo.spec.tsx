import React from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";

// BazaarProvider relies on the automatic JSX runtime; the vitest transform
// compiles its JSX to classic React.createElement, so expose React globally.
(globalThis as unknown as { React: typeof React }).React = React;

// This proves the wishlist toast's Undo is REAL end-to-end, not decorative:
// saving a product yields a toast carrying an `undo`, and invoking that undo
// drives the real provider path that calls the remove-from-wishlist mutation
// and replaces the toast with a plain "Removed from wishlist" (no second Undo).
// It pins the full chain toggleWish -> toast({undo}) -> undo() -> removeProduct.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
}));
// Authed buyer so ensureAuthed() lets the save through.
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ isFetched: true, isError: false, data: { id: "u1" } }),
}));
vi.mock("@/hooks/use-cart", () => ({
  useCartQuery: () => ({ isLoading: false, isFetching: false }),
  useCartMutations: () => ({ addItem: {}, updateQty: {}, removeItem: {} }),
}));

const empty = { productIds: [], sellerIds: [], products: [], sellers: [] };
const addProduct = vi.fn().mockResolvedValue(empty);
const removeProduct = vi.fn().mockResolvedValue(empty);
vi.mock("@/hooks/use-wishlist", () => ({
  useWishlistQuery: () => ({}),
  useWishlistMutations: () => ({
    addProduct: { mutateAsync: addProduct },
    removeProduct: { mutateAsync: removeProduct },
    addSeller: { mutateAsync: vi.fn() },
    removeSeller: { mutateAsync: vi.fn() },
  }),
}));
vi.mock("@/hooks/use-catalog", () => ({ useProduct: () => ({ data: null }) }));

import { BazaarProvider } from "@/providers/bazaar-provider";
import { useBz } from "@/components/common";
import { useBazaarStore } from "@/store/bazaar-store";

let ctx: ReturnType<typeof useBz>;
function Capture() {
  ctx = useBz();
  return null;
}

beforeEach(() => {
  addProduct.mockClear();
  removeProduct.mockClear();
  useBazaarStore.getState().setAuthed(true);
  useBazaarStore.getState().setWish([]);
});

it("saving a product yields a toast whose Undo really removes it from the wishlist", async () => {
  render(
    <BazaarProvider>
      <Capture />
    </BazaarProvider>,
  );

  // Save: optimistic add + the add mutation + an undo-bearing toast.
  await act(async () => {
    await ctx.toggleWish("p1");
  });
  expect(addProduct).toHaveBeenCalledWith("p1");
  expect(useBazaarStore.getState().wish).toContain("p1");
  expect(ctx.toastMsg?.msg).toBe("Saved to wishlist");
  expect(typeof ctx.toastMsg?.undo).toBe("function");

  // Fire the toast's Undo — the real thing the button calls.
  await act(async () => {
    ctx.toastMsg?.undo?.();
  });

  // It actually reverses the save: remove mutation fired, item gone from store.
  expect(removeProduct).toHaveBeenCalledWith("p1");
  expect(useBazaarStore.getState().wish).not.toContain("p1");
  // And the toast becomes a plain confirmation with no further Undo.
  expect(ctx.toastMsg?.msg).toBe("Removed from wishlist");
  expect(ctx.toastMsg?.undo).toBeUndefined();
});
