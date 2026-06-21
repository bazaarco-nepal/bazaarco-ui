import React from "react";
import { it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";

// BazaarProvider relies on the automatic JSX runtime; the vitest transform
// compiles its JSX to classic React.createElement, so expose React globally.
(globalThis as unknown as { React: typeof React }).React = React;

// This proves the saved-items toast's Undo is REAL end-to-end, not decorative:
// saving a product yields a toast carrying an `undo`, and invoking that undo
// drives the real provider path that calls the remove mutation and replaces
// the toast with a plain "Removed from saved" (no second Undo). It pins the
// full chain toggleSaved -> toast({undo}) -> undo() -> removeProduct.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/home",
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
}));
// Authed buyer so ensureAuthed() lets the save through.
vi.mock("@/shared/hooks/use-auth", () => ({
  useCurrentUser: () => ({ isFetched: true, isError: false, data: { id: "u1" } }),
}));
vi.mock("@/buyer/hooks/use-cart", () => ({
  useCartQuery: () => ({ isLoading: false, isFetching: false }),
  useCartMutations: () => ({ addItem: {}, updateQty: {}, removeItem: {} }),
}));

const empty = { productIds: [], sellerIds: [], products: [], sellers: [] };
const addProduct = vi.fn().mockResolvedValue(empty);
const removeProduct = vi.fn().mockResolvedValue(empty);
vi.mock("@/buyer/hooks/use-saved", () => ({
  useSavedQuery: () => ({}),
  useSavedMutations: () => ({
    addProduct: { mutateAsync: addProduct },
    removeProduct: { mutateAsync: removeProduct },
    addSeller: { mutateAsync: vi.fn() },
    removeSeller: { mutateAsync: vi.fn() },
  }),
}));
vi.mock("@/shared/hooks/use-catalog", () => ({ useProduct: () => ({ data: null }) }));

import { BazaarProvider } from "@/providers/bazaar-provider";
import { useBz } from "@/components/common";
import { useBazaarStore } from "@/store/bazaar-store";
import { useToastStore } from "@/lib/toast";

let ctx: ReturnType<typeof useBz>;
function Capture() {
  ctx = useBz();
  return null;
}

const latestToast = () => {
  const { toasts } = useToastStore.getState();
  return toasts[toasts.length - 1];
};

beforeEach(() => {
  addProduct.mockClear();
  removeProduct.mockClear();
  useToastStore.getState().clear();
  useBazaarStore.getState().setAuthed(true);
  useBazaarStore.getState().setSavedProducts([]);
});

it("saving a product yields a toast whose Undo really removes it from saved", async () => {
  render(
    <BazaarProvider>
      <Capture />
    </BazaarProvider>,
  );

  // Save: optimistic add + the add mutation + an undo-bearing toast.
  await act(async () => {
    await ctx.toggleSaved("p1", "Pixel 9");
  });
  expect(addProduct).toHaveBeenCalledWith("p1");
  expect(useBazaarStore.getState().savedProducts).toContain("p1");
  const saveToast = latestToast();
  expect(saveToast?.title).toBe("Saved Pixel 9");
  expect(typeof saveToast?.action?.onClick).toBe("function");

  // Fire the toast's Undo — the real thing the button calls.
  await act(async () => {
    saveToast?.action?.onClick();
  });

  // It actually reverses the save: remove mutation fired, item gone from store.
  expect(removeProduct).toHaveBeenCalledWith("p1");
  expect(useBazaarStore.getState().savedProducts).not.toContain("p1");
  // And the toast becomes a plain confirmation with no further Undo.
  const removeToast = latestToast();
  expect(removeToast?.title).toBe("Removed from saved");
  expect(removeToast?.action).toBeUndefined();
});
