import { describe, it, expect } from "vitest";
import {
  allSelected,
  cartLineKey,
  effectiveSelectedIds,
  isLineSelected,
  pruneSelection,
  selectLine,
  selectedLines,
  toggleAll,
  toggleLine,
  type CartSelection,
} from "@/buyer/lib/cart-selection";

// A cart line — only `id` matters to the selection helpers.
const line = (id: string) => ({ id, price: 100, qty: 1 });
const cart = [line("a"), line("b"), line("c")];

describe("cart-selection — variant lines are addressed independently", () => {
  // Two variants of one product share a product id but are distinct cart lines.
  const vline = (id: string, variantId: string | null) => ({ id, variantId, price: 100, qty: 1 });
  const small = vline("p1", "v-s");
  const large = vline("p1", "v-l");
  const single = vline("p2", null);
  const vcart = [small, large, single];

  it("keys variant lines by product+variant and single-price lines by product id", () => {
    expect(cartLineKey(small)).toBe("p1::v-s");
    expect(cartLineKey(large)).toBe("p1::v-l");
    expect(cartLineKey(single)).toBe("p2");
  });

  it("selecting one variant does not select the other variant of the same product", () => {
    const sel = toggleLine(vcart, null, cartLineKey(large)); // start from all, deselect large
    expect(isLineSelected(cartLineKey(small), sel)).toBe(true);
    expect(isLineSelected(cartLineKey(large), sel)).toBe(false);
    expect(effectiveSelectedIds(vcart, sel)).toEqual(["p1::v-s", "p2"]);
  });

  it("prunes a removed variant line without touching the other variant", () => {
    const sel: CartSelection = ["p1::v-s", "p1::v-l"];
    expect(pruneSelection([small, single], sel)).toEqual(["p1::v-s"]);
  });
});

describe("cart-selection — null sentinel means everything selected", () => {
  it("treats null as all lines selected", () => {
    expect(isLineSelected("a", null)).toBe(true);
    expect(selectedLines(cart, null)).toHaveLength(3);
    expect(effectiveSelectedIds(cart, null)).toEqual(["a", "b", "c"]);
    expect(allSelected(cart, null)).toBe(true);
  });

  it("an explicit list selects only its members", () => {
    const sel: CartSelection = ["a", "c"];
    expect(isLineSelected("a", sel)).toBe(true);
    expect(isLineSelected("b", sel)).toBe(false);
    expect(effectiveSelectedIds(cart, sel)).toEqual(["a", "c"]);
    expect(allSelected(cart, sel)).toBe(false);
  });

  it("empty selection selects nothing (and an empty cart is never all-selected)", () => {
    expect(selectedLines(cart, [])).toHaveLength(0);
    expect(allSelected(cart, [])).toBe(false);
    expect(allSelected([], null)).toBe(false);
  });
});

describe("cart-selection — toggling", () => {
  it("toggling a line off from 'all' materializes the rest", () => {
    expect(toggleLine(cart, null, "b")).toEqual(["a", "c"]);
  });

  it("toggling a line back on re-adds it", () => {
    expect(toggleLine(cart, ["a", "c"], "b")).toEqual(["a", "c", "b"]);
  });

  it("select-all clears when everything is selected, selects all otherwise", () => {
    expect(toggleAll(cart, null)).toEqual([]); // all -> none
    expect(toggleAll(cart, ["a"])).toBeNull(); // partial -> all
    expect(toggleAll(cart, [])).toBeNull(); // none -> all
  });
});

describe("cart-selection — reconciliation when the cart changes", () => {
  it("prunes ids that are no longer in the cart", () => {
    expect(pruneSelection(cart, ["a", "x", "b"])).toEqual(["a", "b"]);
  });

  it("returns the same reference when nothing was pruned (no spurious renders)", () => {
    const sel = ["a", "b"];
    expect(pruneSelection(cart, sel)).toBe(sel);
  });

  it("leaves the null sentinel untouched", () => {
    expect(pruneSelection(cart, null)).toBeNull();
  });

  it("adds a freshly-added line to a materialized selection, no-ops on null", () => {
    expect(selectLine(["a"], "d")).toEqual(["a", "d"]);
    expect(selectLine(["a", "d"], "d")).toEqual(["a", "d"]);
    expect(selectLine(null, "d")).toBeNull();
  });
});
