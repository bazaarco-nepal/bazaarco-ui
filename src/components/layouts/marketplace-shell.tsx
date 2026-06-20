"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { NO_FOOTER_SCREENS, NO_NAV_SCREENS, SELLER_SCREENS, screenFromPath } from "@/config/routes";
import { BottomNav, Toast } from "@/components/ui";
import { Footer, Navbar, useBz } from "@/components/common";
import { AuthRoleGuard } from "@/components/layouts/auth-role-guard";
import { useBazaarStore } from "@/store/bazaar-store";

const BUYER_BOTTOM_NAV_SCREENS = new Set([
  "home",
  "browse",
  "search",
  "bargains",
  "cart",
  "checkout",
  "orders",
  "tracking",
  "profile",
  "profile-edit",
  "wishlist",
  "help",
  "privacy",
  "terms",
  "about",
  "how-it-works",
  "contact",
  "how-to-order",
  "bargaining-guide",
  "store",
  "stores",
]);

function BottomNavBridge() {
  const { nav, cartCount } = useBz();
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const isSeller = SELLER_SCREENS.has(screen);
  const user = useBazaarStore((s) => s.user);

  const bottomNavActive = (() => {
    if (screen === "home") return "home";
    if (screen === "browse" || screen === "search") return "browse";
    if (screen === "video") return "video";
    if (screen === "cart" || screen === "checkout") return "cart";
    // Account groups the buyer's personal screens, including orders.
    if (
      screen === "orders" ||
      screen === "tracking" ||
      screen === "profile" ||
      screen === "profile-edit" ||
      screen === "wishlist" ||
      screen === "help" ||
      screen === "privacy" ||
      screen === "terms" ||
      screen === "about" ||
      screen === "how-it-works" ||
      screen === "contact" ||
      screen === "how-to-order" ||
      screen === "bargaining-guide"
    ) {
      return "profile";
    }
    return null;
  })();

  if (isSeller) {
    if (screen !== "s-onboarding") {
      return <BottomNav seller active={screen} onNav={nav} />;
    }
    return null;
  }

  if (!BUYER_BOTTOM_NAV_SCREENS.has(screen)) {
    return null;
  }

  return (
    <BottomNav
      active={bottomNavActive}
      onNav={nav}
      cartCount={cartCount}
      avatarUrl={user?.avatarUrl}
    />
  );
}

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const screen = screenFromPath(pathname);

  const showNavbar = !NO_NAV_SCREENS.has(screen);
  const showFooter = !NO_FOOTER_SCREENS.has(screen);
  const isVideoScreen = screen === "video";
  const hideNavbarOnMobile = screen === "pdp";

  const ctx = useBz();

  return (
    <>
      <AuthRoleGuard />
      <div id="app-scroll" ref={scrollRef} className={isVideoScreen ? "bz-app--video" : undefined}>
        {showNavbar &&
          (hideNavbarOnMobile ? (
            <div className="bz-hide-mobile">
              <Navbar />
            </div>
          ) : (
            <Navbar />
          ))}
        <main className={isVideoScreen ? "bz-main bz-main--video" : "bz-main"}>{children}</main>
        {showFooter && (
          <div className="bz-hide-mobile">
            <Footer />
          </div>
        )}
      </div>
      <BottomNavBridge />
      <Toast toast={ctx.toastMsg ?? null} />
    </>
  );
}
