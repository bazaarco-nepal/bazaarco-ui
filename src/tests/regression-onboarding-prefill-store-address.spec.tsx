import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The component is authored with the automatic JSX runtime; the vitest transform
// compiles its JSX to classic React.createElement, so expose React globally.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: SellerOnboarding (src/features/seller/seller.tsx).
//
// When a seller who already has a store creates ANOTHER store (the add-store
// flow in store-switcher.tsx), the store name + location are captured at
// creation and then they're sent into KYC. The KYC "Confirm your details" step
// must NOT ask for the same store name/location again — it pre-fills them from
// the already-saved storefront.
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
let org: unknown = null;
let storefront: unknown = undefined;
vi.mock("@/seller/hooks/use-seller", () => ({
  useSellerOrganization: () => ({ data: org, isLoading: false, isError: false, error: null }),
  useSellerStorefront: () => ({ data: storefront, isLoading: false, isError: false }),
  useSetupSellerOrganization: () => noopMutation,
  useSubmitSellerVerification: () => noopMutation,
}));

import { BazaarProvider } from "@/providers/bazaar-provider";
import { SellerOnboarding } from "@/seller/features";
import { useBazaarStore } from "@/store/bazaar-store";

function renderPage() {
  return render(
    <BazaarProvider>
      <SellerOnboarding />
    </BazaarProvider>,
  );
}

// jsdom has no object-URL support; the doc-upload preview calls it.
beforeEach(() => {
  useBazaarStore.getState().setAuthed(true);
  if (!URL.createObjectURL) {
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => "blob:doc";
  }
  if (!URL.revokeObjectURL) {
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
  }
});

// Walk hero -> docPick -> docUpload -> (upload) -> review.
function gotoReview(container: HTMLElement) {
  fireEvent.click(screen.getByRole("button", { name: /register your shop/i }));
  fireEvent.click(screen.getByText(/PAN Card/i));
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["x"], "pan.png", { type: "image/png" });
  fireEvent.change(fileInput, { target: { files: [file] } });
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
}

describe("SellerOnboarding — store address pre-fill", () => {
  it("pre-fills store name and location from an already-created store", () => {
    org = { linked: true, verification: { status: "none" } };
    storefront = {
      shopName: "Bhaktapur Handicraft",
      storeAddress: { city: "Kathmandu", area: "Chabahil", landmark: "Near temple" },
    };
    const { container } = renderPage();
    gotoReview(container);

    // Store name + location carry the values entered at store creation.
    expect(screen.getByDisplayValue("Bhaktapur Handicraft")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Kathmandu")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chabahil")).toBeInTheDocument();
  });

  it("leaves the fields blank for a first-time seller with no store yet", () => {
    org = { linked: false, verification: { status: "none" } };
    storefront = undefined; // gated off — no store, so the query never runs
    const { container } = renderPage();
    gotoReview(container);

    expect(screen.getByPlaceholderText(/e\.g\. Bhaktapur Handicraft/i)).toHaveValue("");
    // City select falls back to the empty "Select city…" option.
    expect(screen.getByDisplayValue(/select city/i)).toBeInTheDocument();
  });
});
