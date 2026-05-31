"use client";

import { usePathname } from "next/navigation";
import { screenFromPath } from "@/config/routes";
import {
  Splash,
  Auth,
  Home,
  Browse,
  PDP,
  VideoTheater,
  Cart,
  Checkout,
  OrderSuccess,
  Tracking,
  Wishlist,
  Bargains,
  Profile,
  ProfileEdit,
  Orders,
  WriteReview,
  SellerShell,
  SellerOnboarding,
  SellerDashboard,
  SellerInbox,
  SellerOrderDetail,
  SellerAddProduct,
  SellerInventory,
  SellerLedger,
  SellerChat,
  SellerBargain,
  SellerPromotions,
  SellerReviews,
  SellerStorefront,
  SellerVideos,
  SellerAnalytics,
  SellerReports,
  SellerSettings,
  SellerProfile,
} from "@/features";
import { useBz } from "@/components/common";
import { SELLER_SCREENS } from "@/config/routes";
import { useBazaarStore } from "@/store/bazaar-store";

export function MarketplaceScreen() {
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const { product } = useBz();
  const orderTotal = useBazaarStore((s) => s.orderTotal);

  if (screen === "splash") return <Splash />;
  if (screen === "auth") return <Auth />;
  if (screen === "home") return <Home />;
  if (screen === "browse") return <Browse />;
  if (screen === "pdp" && product) return <PDP p={product} />;
  if (screen === "video") return <VideoTheater />;
  if (screen === "cart") return <Cart />;
  if (screen === "checkout") return <Checkout />;
  if (screen === "success") return <OrderSuccess total={orderTotal} />;
  if (screen === "tracking") return <Tracking />;
  if (screen === "wishlist") return <Wishlist />;
  if (screen === "bargains") return <Bargains />;
  if (screen === "profile") return <Profile />;
  if (screen === "profile-edit") return <ProfileEdit />;
  if (screen === "orders") return <Orders />;
  if (screen === "review") return <WriteReview />;

  if (SELLER_SCREENS.has(screen)) {
    let inner: React.ReactNode;
    if (screen === "s-onboarding") return <SellerOnboarding />;
    if (screen === "s-dashboard") inner = <SellerDashboard />;
    else if (screen === "s-inbox") inner = <SellerInbox />;
    else if (screen === "s-order-detail") inner = <SellerOrderDetail />;
    else if (screen === "s-add") inner = <SellerAddProduct />;
    else if (screen === "s-products") inner = <SellerInventory />;
    else if (screen === "s-ledger") inner = <SellerLedger />;
    else if (screen === "s-chat") inner = <SellerChat />;
    else if (screen === "s-bargain") inner = <SellerBargain />;
    else if (screen === "s-promos") inner = <SellerPromotions />;
    else if (screen === "s-reviews") inner = <SellerReviews />;
    else if (screen === "s-storefront") inner = <SellerStorefront />;
    else if (screen === "s-videos") inner = <SellerVideos />;
    else if (screen === "s-analytics") inner = <SellerAnalytics />;
    else if (screen === "s-reports") inner = <SellerReports />;
    else if (screen === "s-settings") inner = <SellerSettings />;
    else if (screen === "s-profile") inner = <SellerProfile />;
    else inner = <SellerDashboard />;
    return <SellerShell screen={screen}>{inner}</SellerShell>;
  }

  return <Home />;
}
