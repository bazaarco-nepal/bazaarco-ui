import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// The component is authored with the automatic JSX runtime; the vitest transform
// compiles its JSX to classic React.createElement, so expose React globally.
(globalThis as unknown as { React: typeof React }).React = React;

// REGRESSION: seller KYC verification page (SellerVerificationTimeline in
// src/features/seller/seller.tsx). What this pins after the status-page redesign:
//   1. APPROVED is not a dead end — it shows a "what you've unlocked" summary and
//      a primary "Start listing products" CTA, alongside "Open dashboard".
//   2. The timeline never repeats the same timestamp: submitted + the decision
//      carry a time, but the middle "review" step does not. So when submission and
//      review happen in the same instant, exactly TWO timestamps render, not three.
//   3. PENDING shows the in-progress review state and none of the approved content.
//
// Hooks are mocked so the page renders without react-query or a network. We drive
// the verification status purely from the mocked organization.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/seller/verification",
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
}));
vi.mock("@/hooks/use-auth", () => ({
  useCurrentUser: () => ({ isFetched: true, isError: false, data: { id: "u1" } }),
}));
vi.mock("@/hooks/use-cart", () => ({
  useCartQuery: () => ({ isLoading: false, isFetching: false }),
  useCartMutations: () => ({ addItem: {}, updateQty: {}, removeItem: {} }),
}));
vi.mock("@/hooks/use-wishlist", () => ({
  useWishlistQuery: () => ({}),
  useWishlistMutations: () => ({
    addProduct: { mutateAsync: vi.fn() },
    removeProduct: { mutateAsync: vi.fn() },
    addSeller: { mutateAsync: vi.fn() },
    removeSeller: { mutateAsync: vi.fn() },
  }),
}));
vi.mock("@/hooks/use-catalog", () => ({ useProduct: () => ({ data: null }) }));

// The verification status under test is swapped per-test via this holder.
const noopMutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
let org: unknown = null;
vi.mock("@/hooks/use-seller", () => ({
  useSellerOrganization: () => ({ data: org, isLoading: false, isError: false, error: null }),
  useSetupSellerOrganization: () => noopMutation,
  useSubmitSellerVerification: () => noopMutation,
}));

import { BazaarProvider } from "@/providers/bazaar-provider";
import { SellerVerificationTimeline } from "@/features/seller/seller";
import { useBazaarStore } from "@/store/bazaar-store";

function renderPage() {
  return render(
    <BazaarProvider>
      <SellerVerificationTimeline />
    </BazaarProvider>,
  );
}

beforeEach(() => {
  useBazaarStore.getState().setAuthed(true);
});

describe("SellerVerificationTimeline (status-page redesign)", () => {
  it("approved state shows what's unlocked plus a Start listing products CTA", () => {
    org = {
      linked: true,
      verification: {
        status: "approved",
        canSell: true,
        submittedAt: "2026-06-07T20:09:00Z",
        reviewedAt: "2026-06-09T11:30:00Z",
      },
    };
    renderPage();

    expect(screen.getByText(/your store is live/i)).toBeInTheDocument();
    expect(screen.getByText(/list unlimited products/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start listing products/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open dashboard/i })).toBeInTheDocument();
  });

  it("never repeats a timestamp: submitted + decision render, the review step does not", () => {
    // Submission and review captured at the SAME instant — the old layout printed
    // that one timestamp three times, which read like a bug. Now: exactly two.
    org = {
      linked: true,
      verification: {
        status: "approved",
        canSell: true,
        submittedAt: "2026-06-07T20:09:00Z",
        reviewedAt: "2026-06-07T20:09:00Z",
      },
    };
    const { container } = renderPage();

    expect(container.querySelectorAll(".tnum")).toHaveLength(2);
    expect(screen.getByText(/reviewed by bazaarco/i)).toBeInTheDocument();
  });

  it("pending state shows the in-progress review and none of the approved content", () => {
    org = {
      linked: true,
      verification: {
        status: "pending",
        canSell: false,
        submittedAt: "2026-06-07T20:09:00Z",
        reviewedAt: null,
      },
    };
    renderPage();

    expect(screen.getByText(/under review by bazaarco/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.queryByText(/your store is live/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /start listing products/i })).toBeNull();
    // Only the submission carries a timestamp while review is still pending.
    const { container } = renderPage();
    expect(container.querySelectorAll(".tnum")).toHaveLength(1);
  });
});
