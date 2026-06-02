import { BUYER_SCREENS, SELLER_SCREENS } from "@/config/routes";
import type { AuthIntent, AuthUser } from "@/types/auth";

const PUBLIC_SCREENS = new Set(["auth", "auth-callback"]);

/** Buyer screens an unauthenticated visitor may browse read-only. */
const GUEST_BROWSE_SCREENS = new Set(["home", "browse", "pdp", "video"]);

export function isSellerUser(user?: AuthUser | null): boolean {
  return user?.intent === "seller";
}

export function isBuyerUser(user?: AuthUser | null): boolean {
  return !user || user.intent === "buyer";
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

/** Whether an unauthenticated visitor is allowed on this screen at all. */
export function isGuestAllowedScreen(screen: string): boolean {
  return PUBLIC_SCREENS.has(screen) || GUEST_BROWSE_SCREENS.has(screen);
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
