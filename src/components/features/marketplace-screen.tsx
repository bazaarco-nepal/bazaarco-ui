"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { screenFromPath, titleForScreen } from "@/config/routes";
import {
  Auth,
  AuthCallback,
  Home,
  Browse,
  Search,
  PDP,
  Store,
  VideoTheater,
  Cart,
  Checkout,
  OrderSuccess,
  Tracking,
  Wishlist,
  Bargains,
  Profile,
  ProfileEdit,
  AddressesPage,
  Orders,
  WriteReview,
  reviewProductRef,
  SellerShell,
  SellerOnboarding,
  SellerDashboard,
  SellerInbox,
  SellerOrderDetail,
  SellerAddProduct,
  SellerProductView,
  SellerInventory,
  editProductRef,
  viewProductRef,
  SellerLedger,
  SellerChat,
  SellerBargain,
  SellerPromotions,
  SellerReviews,
  SellerStorefront,
  SellerVideos,
  SellerAnalytics,
  SellerSettings,
  SellerVerificationTimeline,
  SellerProfile,
  AdminSellerVerifications,
  HelpSupportPage,
  FAQPage,
  PrivacyPolicyPage,
  TermsPage,
  AboutPage,
} from "@/features";
import { useBz } from "@/components/common";
import { EmptyState, Spinner } from "@/components/ui";
import { SELLER_SCREENS } from "@/config/routes";
import { isBuyerScreen, isGuestViewableScreen, isSellerUser } from "@/lib/auth-rbac";
import { useBazaarStore } from "@/store/bazaar-store";

/** Centered loader shown while the session probe settles on a gated screen. */
function ScreenLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "96px 24px" }}>
      <Spinner />
    </div>
  );
}

/** Signed-out state for a gated buyer screen — guests land here, then opt in. */
function SignedOutScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bz-container-pad" style={{ padding: "28px 28px 96px" }}>
      <EmptyState
        title="Log in to continue"
        message="Sign in to access your account, orders, bargains, messages, and more."
        cta="Log in"
        onCta={onLogin}
      />
    </div>
  );
}

export function MarketplaceScreen() {
  const pathname = usePathname();
  const routeScreen = screenFromPath(pathname);
  const screenOverride = useBazaarStore((s) => s.screenOverride);
  const setScreenOverride = useBazaarStore((s) => s.setScreenOverride);
  const screen = screenOverride ?? routeScreen;
  const { product, nav } = useBz();
  const orderTotal = useBazaarStore((s) => s.orderTotal);
  const authed = useBazaarStore((s) => s.authed);
  const authReady = useBazaarStore((s) => s.authReady);
  const roleHint = useBazaarStore((s) => s.roleHint);
  const user = useBazaarStore((s) => s.user);

  useEffect(() => {
    if (screenOverride && routeScreen === screenOverride) {
      setScreenOverride(null);
    }
  }, [routeScreen, screenOverride, setScreenOverride]);

  // Keep the browser tab title meaningful per screen. On the product page use
  // the loaded product name; everything else maps to a friendly screen label.
  useEffect(() => {
    const detail = screen === "pdp" ? product?.name : undefined;
    document.title = titleForScreen(screen, detail);
  }, [screen, product?.name]);

  // Gate buyer screens that aren't publicly viewable. Guests stay on the page
  // (no redirect) and see a sign-in CTA. Public/browse screens fall through and
  // render normally; seller screens are bounced upstream by AuthRoleGuard.
  if (isBuyerScreen(screen) && !isGuestViewableScreen(screen)) {
    if (!authReady) return <ScreenLoader />;
    if (!authed) return <SignedOutScreen onLogin={() => nav("auth")} />;
  }

  // A seller should never see buyer content. On a buyer screen, hold a loader
  // whenever this is (or is hinted to be) a seller account, so AuthRoleGuard can
  // redirect to the seller dashboard without the buyer homepage flashing first:
  //   - persisted role hint + probe not yet resolved  → returning-seller cold load
  //   - resolved seller user, redirect not yet applied → the post-probe gap
  if (isBuyerScreen(screen) && (isSellerUser(user) || (!authReady && roleHint === "seller"))) {
    return <ScreenLoader />;
  }

  if (screen === "auth") return <Auth />;
  if (screen === "auth-callback") {
    return (
      <Suspense fallback={null}>
        <AuthCallback />
      </Suspense>
    );
  }
  if (screen === "home") return <Home />;
  if (screen === "browse") return <Browse />;
  if (screen === "search") return <Search />;
  if (screen === "pdp") {
    if (!product) return <ScreenLoader />;
    return <PDP key={product.id} p={product} />;
  }
  if (screen === "store") return <Store />;
  if (screen === "video") return <VideoTheater />;
  if (screen === "cart") return <Cart />;
  if (screen === "checkout") return <Checkout />;
  if (screen === "success") return <OrderSuccess total={orderTotal} />;
  if (screen === "tracking") return <Tracking />;
  if (screen === "wishlist") return <Wishlist />;
  if (screen === "bargains") return <Bargains />;
  if (screen === "messages") return <SellerChat buyerMode />;
  if (screen === "profile") return <Profile />;
  if (screen === "profile-edit") return <ProfileEdit />;
  if (screen === "addresses") return <AddressesPage />;
  if (screen === "orders") return <Orders />;
  if (screen === "review") return <WriteReview productId={reviewProductRef.current ?? undefined} />;
  if (screen === "help") return <HelpSupportPage />;
  if (screen === "faq") return <FAQPage />;
  if (screen === "privacy") return <PrivacyPolicyPage />;
  if (screen === "terms") return <TermsPage />;
  if (screen === "about") return <AboutPage />;

  if (SELLER_SCREENS.has(screen)) {
    let inner: React.ReactNode;
    if (screen === "s-onboarding") return <SellerOnboarding />;
    if (screen === "s-dashboard") inner = <SellerDashboard />;
    else if (screen === "s-inbox") inner = <SellerInbox />;
    else if (screen === "s-order-detail") inner = <SellerOrderDetail />;
    else if (screen === "s-add") inner = <SellerAddProduct />;
    else if (screen === "s-edit")
      // The edit target is set on the ref before navigation. On a cold load
      // (refresh / deep link) there's nothing to edit — fall back to inventory.
      inner = editProductRef.current ? (
        <SellerAddProduct editing={editProductRef.current} />
      ) : (
        <SellerInventory />
      );
    else if (screen === "s-product-view")
      inner = <SellerProductView item={viewProductRef.current} />;
    else if (screen === "s-products") inner = <SellerInventory />;
    else if (screen === "s-ledger") inner = <SellerLedger />;
    else if (screen === "s-chat") inner = <SellerChat />;
    else if (screen === "s-bargain") inner = <SellerBargain />;
    else if (screen === "s-promos") inner = <SellerPromotions />;
    else if (screen === "s-reviews") inner = <SellerReviews />;
    else if (screen === "s-storefront") inner = <SellerStorefront />;
    else if (screen === "s-videos") inner = <SellerVideos />;
    else if (screen === "s-analytics") inner = <SellerAnalytics />;
    else if (screen === "s-verification") inner = <SellerVerificationTimeline />;
    else if (screen === "s-settings") inner = <SellerSettings />;
    else if (screen === "s-profile") inner = <SellerProfile />;
    else if (screen === "s-admin-verify") inner = <AdminSellerVerifications />;
    else inner = <SellerDashboard />;
    return <SellerShell screen={screen}>{inner}</SellerShell>;
  }

  return <Home />;
}
