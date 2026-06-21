"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { pathFromScreen, screenFromPath } from "@/config/routes";
import {
  defaultScreenForUser,
  isBuyerScreen,
  isGuestAllowedScreen,
  isPublicScreen,
  isSellerScreen,
  isSellerUser,
} from "@/shared/lib/auth-rbac";
import { useBazaarStore } from "@/store/bazaar-store";

/**
 * Route access guard:
 * - Unauthenticated visitors may only browse guest-allowed screens; any account
 *   route bounces them to sign-in with a return-to so they land back after login.
 * - Signed-in users are kept on routes that match their role (buyer vs seller).
 */
export function AuthRoleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const authReady = useBazaarStore((s) => s.authReady);
  const authed = useBazaarStore((s) => s.authed);
  const user = useBazaarStore((s) => s.user);

  useEffect(() => {
    // Wait for the session probe to settle so a logged-in user refreshing on a
    // protected page isn't bounced before their session is known.
    if (!authReady) return;

    const screen = screenFromPath(pathname);

    if (!authed || !user) {
      if (!isGuestAllowedScreen(screen)) {
        router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    if (isPublicScreen(screen)) return;

    const seller = isSellerUser(user);

    if (seller && isBuyerScreen(screen)) {
      router.replace(pathFromScreen(defaultScreenForUser(user)));
      return;
    }

    if (!seller && isSellerScreen(screen)) {
      router.replace(pathFromScreen("home"));
    }
  }, [authReady, authed, user, pathname, router]);

  return null;
}
