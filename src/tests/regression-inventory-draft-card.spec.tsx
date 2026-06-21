import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

(globalThis as unknown as { React: typeof React }).React = React;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/seller/products",
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/seller/hooks/use-seller", () => {
  const items: unknown[] = [];
  const inventoryResult = { data: items, isLoading: false, isError: false, error: null };
  const noopMutation = { mutate: () => {}, mutateAsync: async () => {}, isPending: false };
  return {
    useSellerInventory: () => inventoryResult,
    useUpdateProduct: () => noopMutation,
    useDeleteProduct: () => noopMutation,
    useAcknowledgeProductModeration: () => noopMutation,
  };
});

import { ADD_PRODUCT_DRAFT_KEY } from "@/seller/features/_shared/form-workflow";
import { SellerInventory } from "@/seller/features";
import { BazaarCtx } from "@/components/common";
import type { BazaarContextValue } from "@/types/bazaar";

const nav = vi.fn();
const toast = vi.fn();
const bz = { nav, toast } as unknown as BazaarContextValue;

function renderInventory() {
  return render(
    <BazaarCtx.Provider value={bz}>
      <SellerInventory />
    </BazaarCtx.Provider>,
  );
}

beforeEach(() => {
  nav.mockClear();
  toast.mockClear();
  window.localStorage.clear();
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as unknown as typeof window.matchMedia;
  }
});

describe("Inventory — saved draft card", () => {
  it("shows a Continue card for a draft saved in localStorage", async () => {
    window.localStorage.setItem(
      ADD_PRODUCT_DRAFT_KEY,
      JSON.stringify({ title: "Handwoven dhaka topi", price: "1200" }),
    );

    renderInventory();

    expect(await screen.findByText("Handwoven dhaka topi")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("does NOT show a card when no draft is saved", async () => {
    renderInventory();
    // The page renders (its header CTA proves it mounted) but no draft chip.
    await screen.findByText("Add product");
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });

  it("ignores an empty draft (no real content)", async () => {
    window.localStorage.setItem(ADD_PRODUCT_DRAFT_KEY, JSON.stringify({ title: "   ", price: "" }));
    renderInventory();
    await screen.findByText("Add product");
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });
});
