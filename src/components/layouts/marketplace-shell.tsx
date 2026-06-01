"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { NO_FOOTER_SCREENS, NO_NAV_SCREENS, SELLER_SCREENS, screenFromPath } from "@/config/routes";
import { BottomNav, Toast } from "@/components/ui";
import { Footer, Navbar, useBz } from "@/components/common";
import { AuthRoleGuard } from "@/components/layouts/auth-role-guard";

function BottomNavBridge() {
  const { nav } = useBz();
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const isSeller = SELLER_SCREENS.has(screen);

  const bottomNavActive = (() => {
    if (screen === "home") return "home";
    if (screen === "browse") return "browse";
    if (screen === "video") return "video";
    if (screen === "orders" || screen === "tracking") return "orders";
    if (screen === "profile" || screen === "profile-edit" || screen === "wishlist") {
      return "profile";
    }
    return null;
  })();

  if (!bottomNavActive || isSeller) {
    if (isSeller && screen !== "s-onboarding") {
      return <BottomNav seller active={screen} onNav={nav} />;
    }
    return null;
  }

  return <BottomNav active={bottomNavActive} onNav={nav} />;
}

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const screen = screenFromPath(pathname);

  const showNavbar = !NO_NAV_SCREENS.has(screen);
  const showFooter = !NO_FOOTER_SCREENS.has(screen);
  const isVideoScreen = screen === "video";

  const ctx = useBz();

  return (
    <>
      <AuthRoleGuard />
      <div id="app-scroll" ref={scrollRef} className={isVideoScreen ? "bz-app--video" : undefined}>
        {showNavbar && <Navbar />}
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
