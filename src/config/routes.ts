export const BUYER_SCREENS = new Set([
  "home",
  "browse",
  "pdp",
  "store",
  "video",
  "cart",
  "checkout",
  "success",
  "tracking",
  "wishlist",
  "profile",
  "profile-edit",
  "orders",
  "review",
  "bargains",
  "messages",
]);

export const SELLER_SCREENS = new Set([
  "s-onboarding",
  "s-dashboard",
  "s-inbox",
  "s-order-detail",
  "s-add",
  "s-products",
  "s-ledger",
  "s-chat",
  "s-bargain",
  "s-promos",
  "s-reviews",
  "s-storefront",
  "s-videos",
  "s-analytics",
  "s-reports",
  "s-settings",
  "s-profile",
  "s-admin-verify",
]);

export const NO_NAV_SCREENS = new Set([
  "auth",
  "auth-callback",
  "checkout",
  "success",
  "video",
  ...SELLER_SCREENS,
]);

export const NO_FOOTER_SCREENS = new Set([
  "auth",
  "auth-callback",
  "video",
  "checkout",
  "success",
  ...SELLER_SCREENS,
]);

export const NO_HELP_SCREENS = new Set([
  "auth",
  "auth-callback",
  "checkout",
  "video",
  ...SELLER_SCREENS,
]);

const SCREEN_PATH: Record<string, string> = {
  auth: "/auth",
  "auth-callback": "/auth/callback",
  home: "/home",
  browse: "/browse",
  pdp: "/product",
  store: "/store",
  video: "/video",
  cart: "/cart",
  checkout: "/checkout",
  success: "/checkout/success",
  tracking: "/orders/tracking",
  wishlist: "/wishlist",
  profile: "/profile",
  "profile-edit": "/profile/edit",
  orders: "/orders",
  review: "/review",
  bargains: "/bargains",
  messages: "/messages",
  "s-onboarding": "/seller/onboarding",
  "s-dashboard": "/seller",
  "s-inbox": "/seller/inbox",
  "s-order-detail": "/seller/orders/detail",
  "s-add": "/seller/products/add",
  "s-products": "/seller/products",
  "s-ledger": "/seller/ledger",
  "s-chat": "/seller/chat",
  "s-bargain": "/seller/bargain",
  "s-promos": "/seller/promos",
  "s-reviews": "/seller/reviews",
  "s-storefront": "/seller/storefront",
  "s-videos": "/seller/videos",
  "s-analytics": "/seller/analytics",
  "s-reports": "/seller/reports",
  "s-admin-verify": "/seller/admin/verifications",
  "s-settings": "/seller/settings",
  "s-profile": "/seller/profile",
};

const PATH_SCREEN: Record<string, string> = Object.fromEntries(
  Object.entries(SCREEN_PATH).map(([screen, path]) => [path, screen]),
);

PATH_SCREEN["/"] = "home";
PATH_SCREEN["/product"] = "pdp";

export function pathFromScreen(
  screen: string,
  productId?: string,
  searchQuery?: string,
  orderId?: string,
): string {
  if (screen === "pdp" && productId) {
    return `/product/${productId}`;
  }
  if (screen === "tracking" && orderId) {
    return `/orders/tracking/${encodeURIComponent(orderId)}`;
  }
  if (screen === "browse") {
    const q = searchQuery?.trim();
    if (q) {
      return `/browse?q=${encodeURIComponent(q)}`;
    }
  }
  return SCREEN_PATH[screen] ?? "/home";
}

export function searchQueryFromPath(pathname: string): string {
  const idx = pathname.indexOf("?");
  if (idx === -1) return "";
  return new URLSearchParams(pathname.slice(idx + 1)).get("q")?.trim() ?? "";
}

export function screenFromPath(pathname: string): string {
  if (pathname.startsWith("/product/")) {
    return "pdp";
  }
  if (pathname.startsWith("/store/")) {
    return "store";
  }
  if (pathname.startsWith("/orders/tracking")) {
    return "tracking";
  }
  const base = pathname.split("?")[0] ?? pathname;
  return PATH_SCREEN[base] ?? "home";
}

export function productIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/product\/([^/]+)/);
  return match?.[1] ?? null;
}

export function storeIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/store\/([^/]+)/);
  return match?.[1] ?? null;
}

export function orderIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/orders\/tracking\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
