import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// The store switcher lets a seller see which store they're managing and switch
// between their stores (or add one). These tests pin the switch + add behaviour
// independent of the desktop-popover vs mobile-sheet rendering split.

// Keep the real i18n bootstrap (other modules call initReactI18next at import),
// but override useTranslation so t() echoes the key — keeps assertions stable.
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return { ...actual, useTranslation: () => ({ t: (key: string) => key }) };
});

// Button -> useSpaLinkClick reaches for the Next router, which isn't mounted in tests.
vi.mock("next/navigation", () => {
  const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
  return {
    useRouter: () => router,
    usePathname: () => "/seller",
    useSearchParams: () => new URLSearchParams(""),
  };
});

const switchMutate = vi.fn();
const createMutateAsync = vi.fn().mockResolvedValue({});

vi.mock("@/hooks/use-seller", () => ({
  useSwitchActiveStore: () => ({ mutate: switchMutate, isPending: false }),
  useCreateSellerStore: () => ({ mutateAsync: createMutateAsync, isPending: false }),
}));

import { BazaarCtx } from "@/components/common";
import { StoreSwitcherChip } from "@/features/seller/store-switcher";
import type { SellerStoreSummary } from "@/services/api/seller-organization";

const STORES: SellerStoreSummary[] = [
  { sellerId: "shop_a", shopName: "Ram's Store", city: "Kathmandu", logoUrl: null, verified: true },
  { sellerId: "shop_b", shopName: "Branch Two", city: "Pokhara", logoUrl: null, verified: false },
];

const toast = vi.fn();
const nav = vi.fn();

function renderChip(stores = STORES, activeSellerId: string | null = "shop_a") {
  const value = { toast, nav } as unknown as React.ContextType<typeof BazaarCtx>;
  return render(
    <BazaarCtx.Provider value={value}>
      <StoreSwitcherChip variant="sidebar" stores={stores} activeSellerId={activeSellerId} />
    </BazaarCtx.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom has no matchMedia; the switcher uses it to decide sheet-vs-popover.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: "seller.switchStore" }));
}

describe("StoreSwitcherChip", () => {
  it("shows the active store name on the trigger chip", () => {
    renderChip();
    expect(screen.getByText("Ram's Store")).toBeInTheDocument();
  });

  it("lists all stores with their verified status once opened", () => {
    renderChip();
    openPanel();
    const panel = screen.getByRole("dialog");
    expect(within(panel).getByText("Ram's Store")).toBeInTheDocument();
    expect(within(panel).getByText("Branch Two")).toBeInTheDocument();
    expect(within(panel).getByText("seller.storeVerified")).toBeInTheDocument();
    expect(within(panel).getByText("seller.storeUnverified")).toBeInTheDocument();
  });

  it("marks the active store as selected", () => {
    renderChip();
    openPanel();
    const active = screen.getByRole("option", { name: /Ram's Store/ });
    expect(active).toHaveAttribute("aria-selected", "true");
  });

  it("switches to a different store when its row is tapped", () => {
    renderChip();
    openPanel();
    fireEvent.click(screen.getByRole("option", { name: /Branch Two/ }));
    expect(switchMutate).toHaveBeenCalledTimes(1);
    expect(switchMutate.mock.calls[0]![0]).toBe("shop_b");
  });

  it("does not switch when the already-active store is tapped", () => {
    renderChip();
    openPanel();
    fireEvent.click(screen.getByRole("option", { name: /Ram's Store/ }));
    expect(switchMutate).not.toHaveBeenCalled();
  });

  it("opens the add-store modal from the panel", () => {
    renderChip();
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: "seller.addStore" }));
    // Modal renders its own dialog with the store-name field.
    expect(screen.getByText("seller.storeName")).toBeInTheDocument();
  });

  it("blocks store creation until a city is provided", () => {
    renderChip();
    openPanel();
    fireEvent.click(screen.getByRole("button", { name: "seller.addStore" }));
    fireEvent.change(screen.getByLabelText("seller.storeName"), {
      target: { value: "New Shop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "seller.createStore" }));
    expect(createMutateAsync).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("seller.storeCityRequired");
  });
});
