import { describe, it, expect } from "vitest";
import {
  BUYER_SCREENS,
  SELLER_SCREENS,
  pathFromScreen,
  screenFromPath,
  browsePath,
  titleForScreen,
  searchQueryFromPath,
  categoryIdsFromSearchParams,
  productIdFromPath,
  orderIdFromPath,
} from "@/config/routes";

// Link/redirect sanity: every nav target a screen can resolve to must map to a
// real path (no dead screen), and round-trip back to a known screen. This is the
// cheap unit-level guard for the "wrong/dead redirect" class of UI bugs.

const ALL_SCREENS = [...BUYER_SCREENS, ...SELLER_SCREENS];

describe("screen <-> path mapping", () => {
  it("every known buyer screen maps to a non-home path (no dead screen)", () => {
    for (const screen of BUYER_SCREENS) {
      const path = pathFromScreen(screen);
      expect(path, `screen "${screen}" should not fall back to /home`).not.toBe(
        screen === "home" ? "__never__" : "/home",
      );
      expect(path.startsWith("/")).toBe(true);
    }
  });

  it("every seller screen maps to a /seller path", () => {
    for (const screen of SELLER_SCREENS) {
      expect(pathFromScreen(screen).startsWith("/seller")).toBe(true);
    }
  });

  it("static paths round-trip back to their screen", () => {
    const roundTrippable = ALL_SCREENS.filter((s) => !["pdp", "store", "tracking"].includes(s));
    for (const screen of roundTrippable) {
      expect(screenFromPath(pathFromScreen(screen)), `round-trip for "${screen}"`).toBe(screen);
    }
  });

  it("unknown screen falls back to /home", () => {
    expect(pathFromScreen("does-not-exist")).toBe("/home");
  });

  it("parametrised screens embed their id", () => {
    expect(pathFromScreen("pdp", "p123")).toBe("/product/p123");
    expect(pathFromScreen("store", "s9")).toBe("/store/s9");
    expect(pathFromScreen("tracking", undefined, undefined, "ORD 1")).toBe(
      "/orders/tracking/ORD%201",
    );
  });

  it("extracts ids back out of dynamic paths", () => {
    expect(productIdFromPath("/product/p123")).toBe("p123");
    expect(orderIdFromPath("/orders/tracking/ORD%201")).toBe("ORD 1");
    expect(screenFromPath("/product/p123")).toBe("pdp");
    expect(screenFromPath("/store/s9")).toBe("store");
  });
});

describe("browsePath", () => {
  it("plain /browse with no options", () => {
    expect(browsePath()).toBe("/browse");
    expect(browsePath({})).toBe("/browse");
  });

  it("encodes query, joined categories, and sort", () => {
    expect(browsePath({ q: "  shoes  " })).toBe("/browse?q=shoes");
    expect(browsePath({ cat: ["c1", "c2"] })).toBe("/browse?cat=c1%2Cc2");
    expect(browsePath({ q: "x", sort: "price" })).toBe("/browse?q=x&sort=price");
  });

  it("drops empty/whitespace-only values", () => {
    expect(browsePath({ q: "   ", cat: [""], sort: "  " })).toBe("/browse");
  });
});

describe("query helpers", () => {
  it("reads ?q= from a path string", () => {
    expect(searchQueryFromPath("/browse?q=phone")).toBe("phone");
    expect(searchQueryFromPath("/browse")).toBe("");
  });

  it("splits ?cat= from a search-params-like object", () => {
    const params = new URLSearchParams("cat=a,b, c ,");
    expect(categoryIdsFromSearchParams(params)).toEqual(["a", "b", "c"]);
    expect(categoryIdsFromSearchParams(null)).toEqual([]);
  });
});

describe("titleForScreen", () => {
  it("prefixes BazaarCo and uses the screen label", () => {
    expect(titleForScreen("home")).toBe("BazaarCo - Home");
    expect(titleForScreen("review")).toBe("BazaarCo - Write a Review");
  });

  it("uses a detail override when provided", () => {
    expect(titleForScreen("pdp", "Red Shoes")).toBe("BazaarCo - Red Shoes");
  });
});
