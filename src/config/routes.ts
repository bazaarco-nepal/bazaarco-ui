export const BUYER_SCREENS = new Set([
  "home",
  "browse",
  "search",
  "pdp",
  "store",
  "stores",
  "bargainable-products",
  "video",
  "cart",
  "checkout",
  "success",
  "tracking",
  "saved",
  "profile",
  "profile-edit",
  "addresses",
  "orders",
  "review",
  "bargains",
  "messages",
  "help",
  "faq",
  "privacy",
  "terms",
  "about",
  "how-it-works",
  "contact",
  "how-to-order",
  "bargaining-guide",
]);

export const SELLER_SCREENS = new Set([
  "s-onboarding",
  "s-dashboard",
  "s-inbox",
  "s-order-detail",
  "s-add",
  "s-edit",
  "s-product-view",
  "s-products",
  "s-ledger",
  "s-chat",
  "s-bargain",
  "s-reviews",
  "s-questions",
  "s-storefront",
  "s-videos",
  "s-analytics",
  "s-verification",
  "s-settings",
  "s-profile",
  "s-admin-verify",
]);

export const NO_NAV_SCREENS = new Set([
  "auth",
  "auth-callback",
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

const SCREEN_PATH: Record<string, string> = {
  auth: "/auth",
  "auth-callback": "/auth/callback",
  maintenance: "/maintenance",
  home: "/home",
  browse: "/browse",
  search: "/search",
  pdp: "/product",
  store: "/store",
  stores: "/stores",
  "bargainable-products": "/bargainable-products",
  video: "/video",
  cart: "/cart",
  checkout: "/checkout",
  success: "/checkout/success",
  tracking: "/orders/tracking",
  saved: "/saved",
  profile: "/profile",
  "profile-edit": "/profile/edit",
  addresses: "/profile/addresses",
  orders: "/orders",
  review: "/review",
  bargains: "/bargains",
  messages: "/messages",
  help: "/help",
  faq: "/faq",
  privacy: "/privacy",
  terms: "/terms",
  about: "/about",
  "how-it-works": "/how-it-works",
  contact: "/contact",
  "how-to-order": "/how-to-order",
  "bargaining-guide": "/bargaining-guide",
  "s-onboarding": "/seller/onboarding",
  "s-dashboard": "/seller",
  "s-inbox": "/seller/orders",
  "s-order-detail": "/seller/orders/detail",
  "s-add": "/seller/products/add",
  "s-edit": "/seller/products/edit",
  "s-product-view": "/seller/products/view",
  "s-products": "/seller/products",
  "s-ledger": "/seller/ledger",
  "s-chat": "/seller/chat",
  "s-bargain": "/seller/bargain",
  "s-reviews": "/seller/reviews",
  "s-questions": "/seller/questions",
  "s-storefront": "/seller/storefront",
  "s-videos": "/seller/videos",
  "s-analytics": "/seller/analytics",
  "s-admin-verify": "/seller/admin/verifications",
  "s-verification": "/seller/verification",
  "s-settings": "/seller/settings",
  "s-profile": "/seller/profile",
};

const PATH_SCREEN: Record<string, string> = Object.fromEntries(
  Object.entries(SCREEN_PATH).map(([screen, path]) => [path, screen]),
);

PATH_SCREEN["/"] = "home";
PATH_SCREEN["/product"] = "pdp";

/** Watch feed — optional `product` opens that reel first; user can scroll to others. */
export function videoPath(productId?: string): string {
  const base = SCREEN_PATH.video ?? "/video";
  if (!productId?.trim()) return base;
  return `${base}?${new URLSearchParams({ product: productId.trim() }).toString()}`;
}

export function pathFromScreen(
  screen: string,
  productId?: string,
  searchQuery?: string,
  orderId?: string,
): string {
  if (screen === "pdp" && productId) {
    return `/product/${encodeURIComponent(productId)}`;
  }
  if (screen === "store" && productId) {
    return `/store/${encodeURIComponent(productId)}`;
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
  view?: "categories";
};

const SEARCH_SORTS = new Set(["relevance", "newest", "rating", "price_low", "price_high"]);

/** Map legacy browse sort keys to faceted search sort keys. */
export function searchSortFromBrowseParam(
  sort: string | null | undefined,
): "relevance" | "newest" | "rating" | "price_low" | "price_high" | undefined {
  const raw = sort?.trim();
  if (!raw) return undefined;
  if (SEARCH_SORTS.has(raw)) {
    return raw as "relevance" | "newest" | "rating" | "price_low" | "price_high";
  }
  const mapped: Record<string, "relevance" | "newest" | "rating" | "price_low" | "price_high"> = {
    popular: "relevance",
    low: "price_low",
    high: "price_high",
    rating: "rating",
  };
  return mapped[raw];
}

export type SearchPathOptions = {
  q?: string;
  cat?: string | string[];
  sort?: string;
  price_min?: number;
  price_max?: number;
};

/** Build `/search` with optional query, category, and sort params. */
export function searchPath(options?: SearchPathOptions): string {
  const params = new URLSearchParams();
  const q = options?.q?.trim();
  if (q) params.set("q", q);
  const cats = options?.cat;
  if (cats) {
    const joined = (Array.isArray(cats) ? cats : [cats]).filter(Boolean).join(",");
    if (joined) params.set("cat", joined);
  }
  const sort = searchSortFromBrowseParam(options?.sort);
  if (sort && sort !== "relevance") params.set("sort", sort);
  if (typeof options?.price_min === "number") params.set("price_min", String(options.price_min));
  if (typeof options?.price_max === "number") params.set("price_max", String(options.price_max));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Build `/browse` — only the category browser lives on Browse now; every
    product listing (queries, category/price/rating filters, and newest) is one
    faceted page on `/search`. */
export function browsePath(options?: BrowsePathOptions): string {
  if (options?.view === "categories") {
    return "/browse?view=categories";
  }
  return searchPath({
    q: options?.q,
    cat: options?.cat,
    sort: options?.sort,
  });
}

/** Canonical absolute URL for sharing a product link. */
export function productShareUrl(productId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");
  return `${base}${pathFromScreen("pdp", productId)}`;
}

/** Canonical absolute URL for a seller's public storefront — shareable anywhere. */
export function storeShareUrl(sellerId: string, origin?: string): string {
  const raw = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const base = raw.replace(/\/$/, "");
  return `${base}${pathFromScreen("store", sellerId)}`;
}

// Browser-tab label per screen. Rendered as `BazaarCo - <label>`.
const SCREEN_TITLES: Record<string, string> = {
  auth: "Sign In",
  "auth-callback": "Signing In",
  maintenance: "Maintenance",
  home: "Home",
  browse: "Browse Products",
  search: "Search",
  pdp: "Product",
  store: "Store",
  stores: "All Stores",
  "bargainable-products": "Bargainable Products",
  video: "Watch",
  cart: "Your Cart",
  checkout: "Checkout",
  success: "Order Confirmed",
  tracking: "Track Order",
  saved: "Saved",
  bargains: "Bargains",
  messages: "Messages",
  profile: "Account",
  "profile-edit": "Edit Profile",
  addresses: "Saved Addresses",
  orders: "My Orders",
  review: "Write a Review",
  help: "Help & Support",
  faq: "FAQs",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  about: "About Us",
  "how-it-works": "How BazaarCo Works",
  contact: "Contact Us",
  "how-to-order": "How to Order",
  "bargaining-guide": "Bargaining Guide",
  "s-onboarding": "Become a Seller",
  "s-dashboard": "Seller Dashboard",
  "s-inbox": "Orders",
  "s-order-detail": "Order Detail",
  "s-add": "Add Product",
  "s-edit": "Edit Product",
  "s-product-view": "Product Details",
  "s-products": "Inventory",
  "s-ledger": "Ledger",
  "s-chat": "Seller Chat",
  "s-bargain": "Offers",
  "s-reviews": "Reviews",
  "s-questions": "Questions",
  "s-storefront": "Storefront",
  "s-videos": "Seller Videos",
  "s-analytics": "Analytics",
  "s-verification": "KYC Verification",
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

/** Read `?cat=` from Next.js `useSearchParams()` (pathname alone has no query string). */
export function categoryIdsFromSearchParams(
  params: { get: (key: string) => string | null } | null | undefined,
): string[] {
  const raw = params?.get("cat");
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
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
  const match = pathname.match(/^\/product\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function storeIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/store\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function orderIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/orders\/tracking\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const KNOWN_PATH_PREFIXES = Object.values(SCREEN_PATH);

export function isKnownPublicPath(pathname: string): boolean {
  const base = pathname.split("?")[0] ?? pathname;
  return KNOWN_PATH_PREFIXES.some((prefix) => base === prefix || base.startsWith(`${prefix}/`));
}
