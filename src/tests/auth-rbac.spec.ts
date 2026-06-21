import { describe, it, expect } from "vitest";

import { isGuestAllowedScreen, isGuestViewableScreen } from "@/lib/auth-rbac";

describe("guest video access", () => {
  it("a guest sees the real video screen rendered (no sign-in wall to watch)", () => {
    expect(isGuestAllowedScreen("video")).toBe(true);
    expect(isGuestViewableScreen("video")).toBe(true);
  });

  it("the always-public browsing screens stay viewable for guests", () => {
    for (const screen of ["home", "browse", "pdp", "store"]) {
      expect(isGuestViewableScreen(screen), `"${screen}" should be guest-viewable`).toBe(true);
    }
  });

  it("a guest can search for products without signing in", () => {
    expect(isGuestAllowedScreen("search")).toBe(true);
    expect(isGuestViewableScreen("search")).toBe(true);
  });

  it("account screens still require sign-in (guests get the CTA, not the screen)", () => {
    for (const screen of ["cart", "checkout", "orders", "bargains", "saved", "profile"]) {
      expect(isGuestViewableScreen(screen), `"${screen}" must stay gated`).toBe(false);
    }
  });

  it("info screens (faq + siblings) stay viewable for guests", () => {
    for (const screen of [
      "faq",
      "help",
      "privacy",
      "terms",
      "about",
      "how-it-works",
      "contact",
      "how-to-order",
      "bargaining-guide",
    ]) {
      expect(isGuestViewableScreen(screen), `"${screen}" should be guest-viewable`).toBe(true);
    }
  });
});
