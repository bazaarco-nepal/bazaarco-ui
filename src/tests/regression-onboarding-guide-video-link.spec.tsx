import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// The component is authored with the automatic JSX runtime; the vitest transform
// compiles its JSX to classic React.createElement, so expose React globally.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: SellerOnboarding hero (src/features/seller/seller.tsx).
//
// The KYC setup guide card on the onboarding hero must be a real link to the
// hosted walkthrough, opening in a NEW tab so the seller keeps their place in
// onboarding. It used to be a dead <div> with no click target.
//
// Hooks are mocked so the page renders without react-query or a network.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/seller/onboarding",
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
}));
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ isFetched: true, isError: false, data: { id: "u1", name: "Ram" } }),
}));
vi.mock("@/hooks/use-cart", () => ({
  useCartQuery: () => ({ isLoading: false, isFetching: false }),
  useCartMutations: () => ({ addItem: {}, updateQty: {}, removeItem: {} }),
}));
vi.mock("@/hooks/use-saved", () => ({
  useSavedQuery: () => ({}),
  useSavedMutations: () => ({
    addProduct: { mutateAsync: vi.fn() },
    removeProduct: { mutateAsync: vi.fn() },
    addSeller: { mutateAsync: vi.fn() },
    removeSeller: { mutateAsync: vi.fn() },
  }),
}));
vi.mock("@/hooks/use-catalog", () => ({ useProduct: () => ({ data: null }) }));

const noopMutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
vi.mock("@/hooks/use-seller", () => ({
  useSellerOrganization: () => ({
    data: { linked: false, verification: { status: "none" } },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useSellerStorefront: () => ({ data: undefined, isLoading: false, isError: false }),
  useSetupSellerOrganization: () => noopMutation,
  useSubmitSellerVerification: () => noopMutation,
}));

import { BazaarProvider } from "@/providers/bazaar-provider";
import { SellerOnboarding } from "@/features/seller";
import { useBazaarStore } from "@/store/bazaar-store";

beforeEach(() => {
  useBazaarStore.getState().setAuthed(true);
});

describe("SellerOnboarding — KYC setup guide link", () => {
  it("links the guide card to the hosted video, opening in a new tab", () => {
    render(
      <BazaarProvider>
        <SellerOnboarding />
      </BazaarProvider>,
    );

    const guide = screen.getByText(/watch a 2-min seller kyc setup guide/i).closest("a");
    expect(guide).not.toBeNull();
    expect(guide).toHaveAttribute(
      "href",
      "https://drive.google.com/file/d/1eoWLFEhF41YRdWcU1eWUNMNMwjn8K0B6/view?usp=drive_link",
    );
    expect(guide).toHaveAttribute("target", "_blank");
    // New-tab links must not leak the opener window.
    expect(guide).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
