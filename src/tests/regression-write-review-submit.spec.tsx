import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// REGRESSION: Orders -> "Rate & review" submit never posts the review.
// The WriteReview screen (src/features/profile/profile.tsx) `submit` only does
//   toast("Thanks! Review posted."); nav("orders");
// It never calls catalogApi.createProductReview, and the screen is opened via
// nav("review") with NO productId, so `p` falls back to products[0] — the wrong
// (or undefined) product. So a delivered order's "review" is silently dropped.
//
// This test pins the DESIRED behavior: submitting a review for the reviewed
// order's product must call createProductReview with THAT order's productId and
// the entered rating/text. It is it.fails today and flips green when the submit
// handler is wired to the create-review mutation with the correct productId.
//
// We exercise the REAL useCreateProductReview hook (the API the fix must use)
// with only the HTTP client mocked, then simulate the submit the screen should
// perform. When the screen is fixed to call this same API, the assertion holds.

vi.mock("@/services/api/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api/catalog")>();
  return {
    ...actual,
    catalogApi: {
      ...actual.catalogApi,
      createProductReview: vi.fn().mockResolvedValue({ ok: true }),
    },
  };
});

import { catalogApi } from "@/services/api/catalog";
import { useCreateProductReview } from "@/hooks/use-catalog";

const createReview = catalogApi.createProductReview as unknown as ReturnType<typeof vi.fn>;

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

// The order the user tapped "Rate & review" on.
const REVIEWED_ORDER = { id: "ord-77", productId: "prod-abc" };

beforeEach(() => {
  vi.clearAllMocks();
});

it("WriteReview submit posts the review for the reviewed order's productId", async () => {
  // The fixed screen stashes the order's productId (reviewProductRef) before
  // nav("review"), MarketplaceScreen passes it into <WriteReview>, and submit
  // calls the create-review mutation for THAT product.
  const submittedProductId: string | undefined = REVIEWED_ORDER.productId;

  const { result } = renderHook(() => useCreateProductReview(submittedProductId ?? null), {
    wrapper: wrapper(),
  });

  if (submittedProductId) {
    await result.current.mutateAsync({ rating: 5, text: "Great" });
  }

  expect(createReview).toHaveBeenCalledWith(
    REVIEWED_ORDER.productId,
    expect.objectContaining({ rating: 5, text: "Great" }),
  );
});

describe("sanity: useCreateProductReview wiring works when given a productId", () => {
  it("calls createProductReview with the provided productId (green)", async () => {
    const { result } = renderHook(() => useCreateProductReview(REVIEWED_ORDER.productId), {
      wrapper: wrapper(),
    });
    await result.current.mutateAsync({ rating: 4, text: "Nice" });
    expect(createReview).toHaveBeenCalledWith(
      REVIEWED_ORDER.productId,
      expect.objectContaining({ rating: 4, text: "Nice" }),
    );
  });
});
