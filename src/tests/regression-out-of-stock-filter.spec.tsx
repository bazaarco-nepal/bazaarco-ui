import { describe, it, expect } from "vitest";
import type { Product } from "@/types/catalog";
import { mapProduct } from "@/shared/api/catalog";

// REGRESSION: out-of-stock products are NOT excluded from home/browse.
// home.tsx and browse.tsx already filter with `!p.outOfStock`
//   (home: products.filter((p) => !p.outOfStock); browse: !p.outOfStock),
// but NOTHING ever set `outOfStock` from the API's `stock` field. The product
// the UI received kept `outOfStock` undefined even when stock was 0, so a
// sold-out item was rendered as buyable. The fix derives
// `outOfStock = stock <= 0` in catalog `mapProduct` when mapping an API product
// (honoring `outOfStock` when Core emits it directly).
//
// These tests exercise the REAL `mapProduct` (the API consumption path) plus the
// exact `!outOfStock` predicate used by home/browse.

interface ApiProductPayload {
  id: string;
  name: string;
  price: number;
  cat: string;
  seller: string;
  icon: string;
  tint: Product["tint"];
  rating: number;
  reviews: number;
  stock: number;
}

function base(overrides: Partial<ApiProductPayload> & { stock: number }): ApiProductPayload {
  return {
    id: "p",
    name: "Thing",
    price: 100,
    cat: "c",
    seller: "s1",
    icon: "box",
    tint: "blue",
    rating: 0,
    reviews: 0,
    ...overrides,
  };
}

// The real exclusion predicate used by home and browse.
const visible = (products: Product[]) => products.filter((p) => !p.outOfStock);

it("mapProduct sets outOfStock=true when API stock is 0", () => {
  const p = mapProduct(base({ id: "sold-out", stock: 0 }));
  expect(p.outOfStock).toBe(true);
});

it("home/browse exclude a zero-stock product after mapping", () => {
  const inStock = mapProduct(base({ id: "ok", stock: 5 }));
  const sold = mapProduct(base({ id: "sold-out", stock: 0 }));
  const shown = visible([inStock, sold]);
  expect(shown.map((p) => p.id)).toEqual(["ok"]);
});

describe("sanity: the exclusion predicate itself works (green)", () => {
  it("filters out products already flagged outOfStock", () => {
    const a = { ...mapProduct(base({ id: "a", stock: 1 })) };
    const b = { ...mapProduct(base({ id: "b", stock: 1 })), outOfStock: true };
    expect(visible([a, b]).map((p) => p.id)).toEqual(["a"]);
  });
});
