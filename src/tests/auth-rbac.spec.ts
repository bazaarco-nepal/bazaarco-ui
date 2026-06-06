import { describe, it, expect } from "vitest";

import { isGuestAllowedScreen, isGuestViewableScreen } from "@/lib/auth-rbac";

// Guests must be able to WATCH videos without signing in — the reel feed is a
// public, read-only surface. The write actions inside it (like, follow, save,
// add-to-cart) gate themselves with a sign-in prompt, so the screen itself is
// safe to render signed-out. Account screens must still require login.

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

  // Regression: searching for a product must not require sign-in. The faceted
  // /search page is a read-only browsing surface (the Core API /search route is
  // public), so guests see real results, not a "Log in to continue" wall.
  it("a guest can search for products without signing in", () => {
    expect(isGuestAllowedScreen("search")).toBe(true);
    expect(isGuestViewableScreen("search")).toBe(true);
  });

  it("account screens still require sign-in (guests get the CTA, not the screen)", () => {
    for (const screen of ["cart", "checkout", "orders", "bargains", "wishlist", "profile"]) {
      expect(isGuestViewableScreen(screen), `"${screen}" must stay gated`).toBe(false);
    }
  });
});
