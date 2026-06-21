import { BUYER_SCREENS, SELLER_SCREENS } from "@/config/routes";
import type { AuthUser } from "@/types/auth";

const PUBLIC_SCREENS = new Set(["auth", "auth-callback"]);

/**
 * Buyer screens a guest sees rendered normally (read-only browsing). `video` is
 * here too: anyone may watch the reel feed signed-out — the write actions inside
 * it (like, follow, save, add-to-cart) gate themselves with a sign-in prompt.
 */
const GUEST_VIEW_SCREENS = new Set([
  "home",
  "browse",
  "search",
  "pdp",
  "store",
  "stores",
  "bargainable-products",
  "video",
  "help",
  "faq",
  "privacy",
  "terms",
  "about",
  "how-it-works",
  "contact",
  "how-to-order",
  "bargaining-guide",
]);

export function isSellerUser(user?: AuthUser | null): boolean {
  return user?.intent === "seller";
}

/** Default landing screen after sign-in for this account. */
export function defaultScreenForUser(user: AuthUser): string {
  return isSellerUser(user) ? "s-dashboard" : "home";
}

export function isSellerScreen(screen: string): boolean {
  return SELLER_SCREENS.has(screen);
}

export function isBuyerScreen(screen: string): boolean {
  return BUYER_SCREENS.has(screen);
}

export function isPublicScreen(screen: string): boolean {
  return PUBLIC_SCREENS.has(screen);
}

/**
 * Whether a guest may LAND on this screen without a redirect. Guests may stay on
 * any buyer screen — public ones render normally, gated ones show a sign-in CTA
 * at the screen layer (see `isGuestViewableScreen`). Seller screens still bounce.
 */
export function isGuestAllowedScreen(screen: string): boolean {
  return PUBLIC_SCREENS.has(screen) || isBuyerScreen(screen);
}

/**
 * Whether a guest sees the real screen rendered. Public/browse/video screens:
 * yes. Account buyer screens (cart, orders, bargains, account, …): no — the
 * screen layer renders a signed-out sign-in CTA instead of bouncing to /auth.
 */
export function isGuestViewableScreen(screen: string): boolean {
  return PUBLIC_SCREENS.has(screen) || GUEST_VIEW_SCREENS.has(screen);
}

/** Whether this screen is allowed for the signed-in user's role. */
export function canAccessScreen(screen: string, user: AuthUser): boolean {
  if (isPublicScreen(screen)) return true;
  if (isSellerUser(user)) return isSellerScreen(screen);
  return isBuyerScreen(screen);
}

/**
 * Pick post-auth destination: prefer API `next` when it matches the user's role.
 */
export function resolvePostAuthScreen(user: AuthUser, requestedNext: string | null): string {
  if (requestedNext && canAccessScreen(requestedNext, user)) {
    return requestedNext;
  }
  return defaultScreenForUser(user);
}
