import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API client module so no network happens; assert the hook reads the
// right field (`.items`) off the response and syncs it into the zustand store.
vi.mock("@/services/api/cart", () => ({
  cartApi: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

import { cartApi } from "@/services/api/cart";
import { useCartQuery, useCartMutations } from "@/hooks/use-cart";
import { useBazaarStore } from "@/store/bazaar-store";
import type { Product } from "@/types/catalog";

const mockedCart = cartApi as unknown as {
  get: ReturnType<typeof vi.fn>;
  addItem: ReturnType<typeof vi.fn>;
  updateItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const sampleItems = [{ id: "p1", name: "Item", price: 100, qty: 2, seller: "s1" }];

beforeEach(() => {
  vi.clearAllMocks();
  useBazaarStore.setState({ cart: [] });
});

describe("useCartQuery", () => {
  it("fetches the cart and syncs items into the store", async () => {
    mockedCart.get.mockResolvedValue({ items: sampleItems });
    const { result } = renderHook(() => useCartQuery(true), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedCart.get).toHaveBeenCalledTimes(1);
    // Reads the `.items` field off the response, not the response itself.
    expect(result.current.data?.items).toEqual(sampleItems);
    expect(useBazaarStore.getState().cart).toEqual(sampleItems);
  });

  it("does not fetch when disabled", async () => {
    renderHook(() => useCartQuery(false), { wrapper: wrapper() });
    expect(mockedCart.get).not.toHaveBeenCalled();
  });
});

describe("useCartMutations", () => {
  it("addItem calls the API with productId + qty and syncs the response items", async () => {
    mockedCart.addItem.mockResolvedValue({ items: sampleItems });
    const { result } = renderHook(() => useCartMutations(), { wrapper: wrapper() });

    await result.current.addItem.mutateAsync({ product: { id: "p1" } as Product, qty: 2 });

    // variantId is threaded through (undefined here for a single-price product).
    expect(mockedCart.addItem).toHaveBeenCalledWith("p1", 2, undefined);
    expect(useBazaarStore.getState().cart).toEqual(sampleItems);
  });

  it("addItem forwards the chosen variantId", async () => {
    mockedCart.addItem.mockResolvedValue({ items: sampleItems });
    const { result } = renderHook(() => useCartMutations(), { wrapper: wrapper() });

    await result.current.addItem.mutateAsync({
      product: { id: "p1" } as Product,
      qty: 1,
      variantId: "v-l",
    });

    expect(mockedCart.addItem).toHaveBeenCalledWith("p1", 1, "v-l");
  });

  it("updateQty and removeItem forward the right args (incl. variantId)", async () => {
    mockedCart.updateItem.mockResolvedValue({ items: [] });
    mockedCart.removeItem.mockResolvedValue({ items: [] });
    const { result } = renderHook(() => useCartMutations(), { wrapper: wrapper() });

    await result.current.updateQty.mutateAsync({ productId: "p1", qty: 5, variantId: "v-l" });
    await result.current.removeItem.mutateAsync({ productId: "p1", variantId: "v-l" });

    expect(mockedCart.updateItem).toHaveBeenCalledWith("p1", 5, "v-l");
    expect(mockedCart.removeItem).toHaveBeenCalledWith("p1", "v-l");
  });
});
