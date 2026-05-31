"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { pathFromScreen, screenFromPath } from "@/config/routes";
import {
  defaultScreenForUser,
  isBuyerScreen,
  isPublicScreen,
  isSellerScreen,
  isSellerUser,
} from "@/lib/auth-rbac";
import { useBazaarStore } from "@/store/bazaar-store";

/**
 * Redirects signed-in users away from routes that don't match their role (buyer vs seller).
 */
export function AuthRoleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const authed = useBazaarStore((s) => s.authed);
  const user = useBazaarStore((s) => s.user);

  useEffect(() => {
    if (!authed || !user) return;

    const screen = screenFromPath(pathname);
    if (isPublicScreen(screen)) return;

    const seller = isSellerUser(user);

    if (seller && isBuyerScreen(screen)) {
      router.replace(pathFromScreen(defaultScreenForUser(user)));
      return;
    }

    if (!seller && isSellerScreen(screen)) {
      router.replace(pathFromScreen("home"));
    }
  }, [authed, user, pathname, router]);

  return null;
}
