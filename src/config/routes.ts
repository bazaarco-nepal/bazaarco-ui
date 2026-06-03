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
  "addresses",
  "orders",
  "review",
  "bargains",
  "messages",
  "help",
  "privacy",
  "terms",
  "about",
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
  addresses: "/profile/addresses",
  orders: "/orders",
  review: "/review",
  bargains: "/bargains",
  messages: "/messages",
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",
  about: "/about",
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
  return SCREEN_PATH[screen] ?? "/home";
}

export type BrowsePathOptions = {
  q?: string;
  cat?: string | string[];
  sort?: string;
};

/** Build `/browse` with optional search, category, and sort query params. */
export function browsePath(options?: BrowsePathOptions): string {
  const params = new URLSearchParams();
  const q = options?.q?.trim();
  if (q) params.set("q", q);
  const cats = options?.cat;
  if (cats) {
    const joined = (Array.isArray(cats) ? cats : [cats]).filter(Boolean).join(",");
    if (joined) params.set("cat", joined);
  }
  const sort = options?.sort?.trim();
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/browse?${qs}` : "/browse";
}

// Browser-tab label per screen. Rendered as `BazaarCo - <label>`.
const SCREEN_TITLES: Record<string, string> = {
  auth: "Sign In",
  "auth-callback": "Signing In",
  home: "Home",
  browse: "Browse Products",
  pdp: "Product",
  store: "Store",
  video: "Watch",
  cart: "Your Cart",
  checkout: "Checkout",
  success: "Order Confirmed",
  tracking: "Track Order",
  wishlist: "Wishlist",
  bargains: "Bargains",
  messages: "Messages",
  profile: "Account",
  "profile-edit": "Edit Profile",
  addresses: "Saved Addresses",
  orders: "My Orders",
  review: "Write a Review",
  help: "Help & Support",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  about: "About Us",
  "s-onboarding": "Become a Seller",
  "s-dashboard": "Seller Dashboard",
  "s-inbox": "Seller Orders",
  "s-order-detail": "Order Detail",
  "s-add": "Add Product",
  "s-products": "Inventory",
  "s-ledger": "Ledger",
  "s-chat": "Seller Chat",
  "s-bargain": "Offers",
  "s-promos": "Promotions",
  "s-reviews": "Store Reviews",
  "s-storefront": "Storefront",
  "s-videos": "Seller Videos",
  "s-analytics": "Analytics",
  "s-reports": "Reports",
  "s-settings": "Settings",
  "s-profile": "Seller Profile",
  "s-admin-verify": "Seller Verifications",
};

/**
 * Builds the document title for a screen, e.g. `BazaarCo - Home`. Pass `detail`
 * to override the label (the product or store name on detail pages).
 */
export function titleForScreen(screen: string, detail?: string): string {
  const label = detail?.trim() || SCREEN_TITLES[screen] || "Shop";
  return `BazaarCo - ${label}`;
}

export function searchQueryFromPath(pathname: string): string {
  const idx = pathname.indexOf("?");
  if (idx === -1) return "";
  return new URLSearchParams(pathname.slice(idx + 1)).get("q")?.trim() ?? "";
}

export function categoryIdsFromPath(pathname: string): string[] {
  const idx = pathname.indexOf("?");
  if (idx === -1) return [];
  const raw = new URLSearchParams(pathname.slice(idx + 1)).get("cat");
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function sortFromPath(pathname: string): string | null {
  const idx = pathname.indexOf("?");
  if (idx === -1) return null;
  return new URLSearchParams(pathname.slice(idx + 1)).get("sort");
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
