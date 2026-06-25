import { describe, it, expect } from "vitest";
import {
  BUYER_SCREENS,
  SELLER_SCREENS,
  pathFromScreen,
  productShareUrl,
  storeShareUrl,
  screenFromPath,
  browsePath,
  searchPath,
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
    expect(pathFromScreen("pdp", "p 123")).toBe("/product/p%20123");
    expect(pathFromScreen("store", "s9")).toBe("/store/s9");
    expect(pathFromScreen("tracking", undefined, undefined, "ORD 1")).toBe(
      "/orders/tracking/ORD%201",
    );
    expect(pathFromScreen("s-order-detail", undefined, undefined, "SUB 1")).toBe(
      "/seller/orders/SUB%201",
    );
  });

  it("extracts ids back out of dynamic paths", () => {
    expect(productIdFromPath("/product/p123")).toBe("p123");
    expect(productIdFromPath("/product/p%20123")).toBe("p 123");
    expect(orderIdFromPath("/orders/tracking/ORD%201")).toBe("ORD 1");
    expect(screenFromPath("/product/p123")).toBe("pdp");
    expect(screenFromPath("/store/s9")).toBe("store");
    expect(screenFromPath("/seller/orders/SUB%201")).toBe("s-order-detail");
  });
});

describe("productShareUrl", () => {
  it("builds an encoded absolute product link", () => {
    expect(productShareUrl("p 1", "https://bazaarco.com")).toBe(
      "https://bazaarco.com/product/p%201",
    );
  });
});

describe("storeShareUrl", () => {
  it("builds an encoded absolute store link a seller can share", () => {
    expect(storeShareUrl("s9", "https://bazaarco.com")).toBe("https://bazaarco.com/store/s9");
    expect(storeShareUrl("seller 1", "https://bazaarco.com")).toBe(
      "https://bazaarco.com/store/seller%201",
    );
  });

  it("strips a trailing slash from the origin so the URL never doubles up", () => {
    expect(storeShareUrl("s9", "https://bazaarco.com/")).toBe("https://bazaarco.com/store/s9");
  });
});

describe("browsePath", () => {
  it("delegates product listings to /search", () => {
    expect(browsePath()).toBe("/search");
    expect(browsePath({})).toBe("/search");
    expect(browsePath({ q: "  shoes  " })).toBe("/search?q=shoes");
    expect(browsePath({ cat: ["c1", "c2"] })).toBe("/search?cat=c1%2Cc2");
  });

  it("keeps the category browser on /browse", () => {
    expect(browsePath({ view: "categories" })).toBe("/browse?view=categories");
  });

  it("sends the newest listing to the unified /search page", () => {
    expect(browsePath({ sort: "newest" })).toBe("/search?sort=newest");
  });

  it("drops empty/whitespace-only values", () => {
    expect(browsePath({ q: "   ", cat: [""], sort: "  " })).toBe("/search");
  });
});

describe("searchPath", () => {
  it("builds faceted search URLs", () => {
    expect(searchPath()).toBe("/search");
    expect(searchPath({ q: "premium" })).toBe("/search?q=premium");
    expect(searchPath({ cat: "fashion" })).toBe("/search?cat=fashion");
    expect(searchPath({ sort: "low" })).toBe("/search?sort=price_low");
    expect(searchPath({ sort: "newest" })).toBe("/search?sort=newest");
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
