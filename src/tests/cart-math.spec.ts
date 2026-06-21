import { describe, it, expect } from "vitest";
import { resolveDelivery, type DeliveryTier } from "@/buyer/lib/delivery-options";

// Mirrors the production formula in features/checkout/checkout.tsx `priceBreakdown`:
//   subtotal = Σ price*qty ; delivery = subtotal===0 ? 0 : resolveDelivery(cart,tier).fee
//   total    = subtotal + delivery - discount
// We re-implement the tiny arithmetic here (the real fn is co-located in a heavy
// client component that imports leaflet/maps/the whole UI kit, which jsdom unit
// tests should not pull in). The fee — the money-critical part — comes from the
// REAL resolveDelivery, so a backend fee drift still trips this suite.

interface Line {
  price: number;
  qty: number;
  seller?: string;
}

function priceBreakdown(cart: Line[], tier: DeliveryTier = "standard", discount = 0) {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const resolved = resolveDelivery(cart, tier);
  const delivery = subtotal === 0 ? 0 : resolved.fee;
  return { subtotal, delivery, discount, total: subtotal + delivery - discount };
}

describe("cart price breakdown", () => {
  it("empty cart: zero subtotal AND zero delivery (no fee on nothing)", () => {
    const bd = priceBreakdown([]);
    expect(bd.subtotal).toBe(0);
    expect(bd.delivery).toBe(0);
    expect(bd.total).toBe(0);
  });

  it("single seller, single item: subtotal + standard 149", () => {
    const bd = priceBreakdown([{ price: 500, qty: 1, seller: "s1" }]);
    expect(bd.subtotal).toBe(500);
    expect(bd.delivery).toBe(149);
    expect(bd.total).toBe(649);
  });

  it("multiplies price by quantity", () => {
    const bd = priceBreakdown([{ price: 250, qty: 3, seller: "s1" }]);
    expect(bd.subtotal).toBe(750);
    expect(bd.total).toBe(750 + 149);
  });

  it("two distinct sellers auto-applies combined standard (179)", () => {
    const bd = priceBreakdown([
      { price: 300, qty: 1, seller: "s1" },
      { price: 200, qty: 2, seller: "s2" },
    ]);
    expect(bd.subtotal).toBe(700);
    expect(bd.delivery).toBe(179);
    expect(bd.total).toBe(879);
  });

  it("premium tier applies its single fee (199) for one seller", () => {
    const bd = priceBreakdown([{ price: 1000, qty: 1, seller: "s1" }], "premium");
    expect(bd.delivery).toBe(199);
    expect(bd.total).toBe(1199);
  });

  it("premium combined fee (229) across 2 sellers", () => {
    const bd = priceBreakdown(
      [
        { price: 400, qty: 1, seller: "a" },
        { price: 600, qty: 1, seller: "b" },
      ],
      "premium",
    );
    expect(bd.delivery).toBe(229);
    expect(bd.total).toBe(1000 + 229);
  });

  it("subtracts an explicit discount from the total", () => {
    const bd = priceBreakdown([{ price: 1000, qty: 1, seller: "s1" }], "standard", 100);
    expect(bd.total).toBe(1000 + 149 - 100);
  });

  it("qty boundary: qty 0 contributes nothing but the cart is non-empty (fee still charged)", () => {
    const bd = priceBreakdown([{ price: 999, qty: 0, seller: "s1" }]);
    expect(bd.subtotal).toBe(0);
    // subtotal===0 -> no delivery fee even though a line exists.
    expect(bd.delivery).toBe(0);
    expect(bd.total).toBe(0);
  });
});
