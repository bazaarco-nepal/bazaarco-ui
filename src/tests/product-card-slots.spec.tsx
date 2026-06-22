import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

(globalThis as unknown as { React: typeof React }).React = React;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));

import { ProductCard, BazaarCtx } from "@/components/common";
import { BuyerPack } from "@/components/ui";
import type { BazaarContextValue } from "@/types/bazaar";
import type { Product } from "@/types";

const bz = { toggleSaved: vi.fn(), savedProducts: [] as string[] } as unknown as BazaarContextValue;

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Handwoven dhaka topi",
    price: 1000,
    cat: "fashion",
    seller: "s1",
    icon: "shirt",
    tint: "red",
    rating: 0,
    reviews: 0,
    ...overrides,
  } as Product;
}

function renderCard(p: Product, extra: Record<string, unknown> = {}) {
  return render(
    <BuyerPack>
      <BazaarCtx.Provider value={bz}>
        <ProductCard p={p} onClick={vi.fn()} {...extra} />
      </BazaarCtx.Provider>
    </BuyerPack>,
  );
}

describe("ProductCard — equal-height slots", () => {
  it("renders 'No reviews yet' (never '(0)') when there are zero reviews", () => {
    renderCard(makeProduct({ reviews: 0, rating: 0 }));
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByText(/\(0\)/)).not.toBeInTheDocument();
  });

  it("shows the rating + count when there are reviews", () => {
    renderCard(makeProduct({ reviews: 128, rating: 4.6 }));
    expect(screen.queryByText("No reviews yet")).not.toBeInTheDocument();
    expect(screen.getByText("(128)")).toBeInTheDocument();
  });

  it("shows struck price + savings pill for a meaningful discount", () => {
    renderCard(makeProduct({ price: 1000, original: 1500 }));
    expect(screen.getByText("Rs. 1,500")).toBeInTheDocument(); // struck original
    expect(screen.getByText("Save Rs. 500")).toBeInTheDocument(); // 500 >= 50
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument(); // no top-corner % badge
  });

  it("shows the struck price but no savings line below the threshold", () => {
    renderCard(makeProduct({ price: 1483, original: 1500 }));
    expect(screen.getByText("Rs. 1,500")).toBeInTheDocument(); // struck original still shows
    expect(screen.queryByText(/^Save /)).not.toBeInTheDocument(); // 17 < 50, suppressed
  });

  it("renders the bargain CTA as an outline button when given a CTA", () => {
    renderCard(makeProduct(), { ctaLabel: "Make an offer", ctaIcon: "bargain", onCta: vi.fn() });
    const cta = screen.getByRole("button", { name: /make an offer/i });
    expect(cta).toBeInTheDocument();
    expect(cta.className).toContain("btn--bargainOutline");
  });
});
