export type Tint = "red" | "blue" | "saffron" | "purple" | "slate" | "green" | "gold" | "teal";

export type CategoryAttributeType = "select" | "multi" | "text" | "num" | "toggle" | "date";

// A single metadata attribute a seller fills when listing a product in a
// category. Carried on `Category.fields` and drives the Add Product form.
export interface CategoryAttributeField {
  k: string;
  en: string;
  t: CategoryAttributeType;
  req?: boolean;
  o?: string[];
  allowOther?: boolean;
  u?: string;
  help?: string;
}

export interface Category {
  id: string;
  en: string;
  fields: CategoryAttributeField[];
}

export interface StoreAddress {
  city: string;
  area?: string;
  landmark?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface Seller {
  id: string;
  // Vanity handle for the public URL (/store/<slug>); falls back to id when absent.
  slug?: string;
  name: string;
  rating: number;
  reviews: number;
  city?: string;
  storeAddress?: StoreAddress | null;
  tint?: Tint;
  avatar: string;
  bannerUrl?: string | null;
  aboutText?: string | null;
  verified?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
}

/** Inline seller snapshot embedded in the product detail response. */
export interface ProductSeller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
}

export interface Product {
  id: string;
  name: string;
  // Optional Nepali product name; falls back to `name` when absent (see displayProductName).
  ne?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  price: number;
  original?: number;
  // How the active discount was entered (so the seller edit form round-trips).
  // null/absent = no discount; 'amount' = a discounted price; 'percent' = % off.
  discountType?: "amount" | "percent" | null;
  discountPct?: number | null;
  /** Category id — used for filtering and URLs. */
  cat: string;
  /** Display label from the categories catalog; present on API product payloads. */
  category?: { id: string; en: string };
  seller: string;
  /** Inline seller info from the product detail endpoint. */
  sellerInfo?: ProductSeller;
  icon: string;
  rating: number;
  reviews: number;
  hasVideo?: boolean;
  videoThumb?: string;
  videoUrl?: string | null;
  videoPublicId?: string | null;
  img?: string;
  // Gallery, cover first. Sellers list with 3–5 images; `img` mirrors images[0].
  images?: string[];
  outOfStock?: boolean;
  allowBargaining?: boolean;
  // The seller's bargaining floor is private and never sent to buyers, so it is
  // deliberately absent here. Seller-only views read it from SellerInventoryItem.
  // Priced variants (Small/Medium/Large, etc.). `price` is the effective
  // (possibly discounted) variant price; `original` the struck-through price.
  variants?: PricedVariant[];
  /**
   * Defines variant dimensions when multi-dimensional variants are used.
   * e.g. [{name:"Color",options:["Orange","Black"]},{name:"Storage",options:["256GB","512GB"]}]
   * Null/absent for products using flat single-name variants.
   */
  variantGroups?: Array<{ name: string; options: string[] }> | null;
  /** Option-level images, one per attribute value (e.g. per Color). */
  optionImages?: OptionImage[];
  createdAt?: string;
  /** Manufacturer/brand label, when the seller provided one. */
  brand?: string | null;
  /** Seller-supplied stock keeping unit. */
  sku?: string | null;
  /** Seller-entered search keywords (SEO). */
  keywords?: string | null;
  /** Server-computed availability so the UI never re-derives the rule. */
  stockStatus?: StockStatus;
  /** Total purchasable units (caps the quantity selector). */
  availableStock?: number;
  warranty?: ProductWarranty;
}

export type StockStatus = "in_stock" | "out_of_stock" | "unavailable";

export interface ProductWarranty {
  available: boolean;
  durationMonths: number | null;
  type: string | null;
  notes: string | null;
}

/** Seller trust signals for the PDP seller card (GET /catalog/sellers/:id/trust). */
export interface SellerTrust {
  id: string;
  slug?: string;
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  joinedAt: string;
  ordersCompleted: number;
  productsSold: number;
  /** null when the store has no reviews yet — render "New seller" instead. */
  positiveRatingPct: number | null;
}

export interface PricedVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  original?: number | null;
  allowBargaining?: boolean;
  /** Maps dimension name → selected option for multi-dimensional variants. */
  optionValues?: Record<string, string> | null;
  /** Optional photo specific to this variant (e.g. colour swatch). */
  imageUrl?: string | null;
  /** Server-resolved image (exact → option → product main → gallery). */
  resolvedImageUrl?: string | null;
  /** Immutable, server-generated platform SKU. */
  platformSku?: string;
  /** Optional seller-chosen code. */
  sellerSku?: string | null;
}

/** An option-level image: one photo per attribute value (e.g. per Color). */
export interface OptionImage {
  optionName: string;
  optionValue: string;
  imageUrl: string;
}

export interface CartLine extends Product {
  qty: number;
  // The chosen variant for this line (null/absent for single-price products).
  variantId?: string | null;
  variantName?: string | null;
  // Set when an accepted bargain is bound to this line — `price` then already
  // carries the bargained amount the server will charge at checkout.
  bargained?: boolean;
  bargainExpiresAt?: string | null;
}

export interface ProductReview {
  id: string;
  name: string;
  city: string;
  rating: number;
  /** ISO timestamp; formatted for display client-side. */
  date: string;
  text: string;
  photoUrls: string[];
  avatar: string | null;
  tint: Tint;
  /** True when the review is tied to a real buyer who passed the purchase gate. */
  verified: boolean;
}

export interface ProductReviewEligibility {
  canReview: boolean;
  hasPurchased: boolean;
  // True only once a delivered order contains the product — the real gate to review.
  hasDelivered: boolean;
  hasReviewed: boolean;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  buyer: string;
  avatar: string | null;
  stars: number;
  text: string;
  time: string;
  replied: boolean;
  reply: string | null;
  low: boolean;
}

export interface RatingDistribution {
  s: number;
  count: number;
  pct: number;
}

export interface ProductQuestionAnswer {
  text: string;
  answeredBy: string | null;
  answeredAt: string | null;
}

export interface ProductQuestion {
  id: string;
  askerName: string;
  // null for guest askers (and signed-in users without a photo) — UI falls back to initials.
  askerAvatarUrl: string | null;
  text: string;
  status: "pending" | "answered";
  createdAt: string;
  // null until the seller answers.
  answer: ProductQuestionAnswer | null;
}

export interface ProductVariantOption {
  label: string;
  tint?: Tint;
}

export interface ProductVariant {
  name: string;
  kind: "swatch" | "pill";
  options: (string | ProductVariantOption)[];
  default?: number;
}

export interface ProductProfile {
  variants: ProductVariant[];
  specs: [string, string][];
  desc: string;
}
