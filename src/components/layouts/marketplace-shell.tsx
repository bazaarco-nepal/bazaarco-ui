"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  NO_FOOTER_SCREENS,
  NO_NAV_SCREENS,
  SELLER_SCREENS,
  screenFromPath,
  pathFromScreen,
} from "@/config/routes";
import { BuyerPack, BuyerBottomNav } from "@/buyer/ui";
import { SellerBottomNav } from "@/seller/ui";
import { CheckoutHeader, Footer, Navbar, useBz } from "@/components/common";
import { AuthRoleGuard } from "@/components/layouts/auth-role-guard";
import { useBazaarStore } from "@/store/bazaar-store";
import { Icon, Button, AppLink } from "@/components/ui";

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
  "saved",
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

function GuestSignInSheet({
  open,
  onClose,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignIn: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const benefits = [
    { icon: "heart" as const, label: t("guestSignIn.benefitSave") },
    { icon: "bargain" as const, label: t("guestSignIn.benefitBargain") },
    { icon: "package" as const, label: t("guestSignIn.benefitTrack") },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 700,
        background: "rgba(11,18,32,.45)",
      }}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-sheet-title"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "0 20px calc(36px + env(safe-area-inset-bottom, 0px))",
          maxHeight: "80dvh",
          overflowY: "auto",
          boxShadow: "0 -8px 30px rgba(11,18,32,.18)",
          animation: "bz-store-sheet-up 0.24s var(--ease)",
        }}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={undefined}
      >
        {/* drag handle */}
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "var(--line-200)",
            margin: "12px auto 20px",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <p
            id="guest-sheet-title"
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "var(--ink-900)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {t("guestSignIn.mobileHeadline")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-400)",
              padding: 6,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {benefits.map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--tint-blue-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={icon} size={20} color="var(--blue)" />
              </div>
              <span
                style={{
                  fontSize: ".9375rem",
                  fontWeight: 500,
                  color: "var(--ink-700)",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <Button variant="primary" full size="lg" onClick={onSignIn}>
          {t("auth.signIn")}
        </Button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <AppLink
            href={pathFromScreen("auth")}
            onNavigate={onSignIn}
            style={{
              fontSize: ".875rem",
              color: "var(--blue)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {t("guestSignIn.createAccount")}
          </AppLink>
        </div>
      </div>
    </div>
  );
}

function BottomNavBridge() {
  const { nav, cartCount } = useBz();
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const isSeller = SELLER_SCREENS.has(screen);
  const user = useBazaarStore((s) => s.user);
  const authed = useBazaarStore((s) => s.authed);
  const [sheetOpen, setSheetOpen] = useState(false);

  const bottomNavActive = (() => {
    if (screen === "home") return "home";
    if (screen === "browse" || screen === "search") return "browse";
    if (screen === "video") return "video";
    if (screen === "bargains") return "bargains";
    // Account groups the buyer's personal screens, including orders.
    if (
      screen === "orders" ||
      screen === "tracking" ||
      screen === "profile" ||
      screen === "profile-edit" ||
      screen === "saved" ||
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

  const handleNav = (target: string) => {
    if (target === "profile" && !authed) {
      setSheetOpen(true);
      return;
    }
    nav(target);
  };

  if (isSeller) {
    if (screen !== "s-onboarding") {
      return <SellerBottomNav active={screen} onNav={nav} />;
    }
    return null;
  }

  if (!BUYER_BOTTOM_NAV_SCREENS.has(screen)) {
    return null;
  }

  return (
    <>
      <BuyerBottomNav
        active={bottomNavActive}
        onNav={handleNav}
        cartCount={cartCount}
        avatarUrl={user?.avatarUrl}
      />
      <GuestSignInSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSignIn={() => {
          setSheetOpen(false);
          nav("auth");
        }}
      />
    </>
  );
}

export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const screen = screenFromPath(pathname);

  const isCheckout = screen === "checkout";
  // Checkout swaps the full navbar for a slim header to keep buyers in the funnel.
  const showNavbar = !isCheckout && !NO_NAV_SCREENS.has(screen);
  const showFooter = !NO_FOOTER_SCREENS.has(screen);
  const isVideoScreen = screen === "video";
  const hideNavbarOnMobile = screen === "pdp";

  return (
    <BuyerPack>
      <AuthRoleGuard />
      <div id="app-scroll" ref={scrollRef} className={isVideoScreen ? "bz-app--video" : undefined}>
        {isCheckout && <CheckoutHeader />}
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
    </BuyerPack>
  );
}
