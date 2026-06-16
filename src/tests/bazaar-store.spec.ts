import { describe, it, expect, beforeEach } from "vitest";
import { useBazaarStore } from "@/store/bazaar-store";
import type { CartLine } from "@/types/catalog";

// zustand store cart logic: add / update qty / remove, and totals derived from
// the cart. The store exposes setCart with a functional updater, so we drive
// add/update/remove through that (same path the cart hook uses).

function line(id: string, price: number, qty: number, seller = "s1"): CartLine {
  return {
    id,
    name: id,
    price,
    qty,
    seller,
    cat: "c",
    icon: "box",
    tint: "blue",
    rating: 0,
    reviews: 0,
  } as CartLine;
}

const fresh = () => useBazaarStore.getState();

beforeEach(() => {
  useBazaarStore.setState({ cart: [], orderTotal: 0, query: "", deliveryTier: "standard" });
});

describe("cart store mutations", () => {
  it("adds an item to an empty cart", () => {
    fresh().setCart((c) => [...c, line("p1", 100, 1)]);
    expect(fresh().cart).toHaveLength(1);
    expect(fresh().cart[0]?.id).toBe("p1");
  });

  it("updates quantity of an existing line", () => {
    fresh().setCart([line("p1", 100, 1)]);
    fresh().setCart((c) => c.map((it) => (it.id === "p1" ? { ...it, qty: 4 } : it)));
    expect(fresh().cart[0]?.qty).toBe(4);
  });

  it("removes a line by id", () => {
    fresh().setCart([line("p1", 100, 1), line("p2", 50, 2)]);
    fresh().setCart((c) => c.filter((it) => it.id !== "p1"));
    expect(fresh().cart.map((it) => it.id)).toEqual(["p2"]);
  });

  it("replaces the whole cart with a plain array (server sync path)", () => {
    fresh().setCart([line("p1", 100, 1)]);
    fresh().setCart([line("p9", 10, 9)]);
    expect(fresh().cart).toHaveLength(1);
    expect(fresh().cart[0]?.id).toBe("p9");
  });

  it("computes a subtotal across lines via reduce (Σ price*qty)", () => {
    fresh().setCart([line("p1", 100, 2), line("p2", 50, 3)]);
    const subtotal = fresh().cart.reduce((s, it) => s + it.price * it.qty, 0);
    expect(subtotal).toBe(350);
  });
});

describe("misc store setters", () => {
  it("setQuery / setOrderTotal / setDeliveryTier update state", () => {
    fresh().setQuery("shoes");
    fresh().setOrderTotal(999);
    fresh().setDeliveryTier("premium");
    expect(fresh().query).toBe("shoes");
    expect(fresh().orderTotal).toBe(999);
    expect(fresh().deliveryTier).toBe("premium");
  });
});
