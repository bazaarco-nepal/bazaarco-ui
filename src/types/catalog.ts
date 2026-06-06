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
  // Icon is resolved from a code map by id (see CATEGORY_ICON in
  // components/common/marketplace.tsx), not served by the API.
  tint: Tint;
  img: string;
  fields: CategoryAttributeField[];
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  city: string;
  tint: Tint;
  avatar: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  price: number;
  original?: number;
  cat: string;
  seller: string;
  icon: string;
  tint: Tint;
  rating: number;
  reviews: number;
  hasVideo?: boolean;
  videoThumb?: string;
  videoUrl?: string | null;
  eta: string;
  tag?: string;
  img?: string;
  // Gallery, cover first. Sellers list with 3–5 images; `img` mirrors images[0].
  images?: string[];
  lowStock?: number;
  outOfStock?: boolean;
  allowBargaining?: boolean;
  maxDiscountPct?: number;
  minimumPrice?: number | null;
  createdAt?: string;
}

export interface CartLine extends Product {
  qty: number;
}

export interface ProductReview {
  name: string;
  city: string;
  rating: number;
  date: string;
  text: string;
  photos: number;
  photoUrls: string[];
  avatar: string | null;
  tint: Tint;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  buyer: string;
  avatar: string | null;
  stars: number;
  product: string;
  text: string;
  time: string;
  replied: boolean;
  reply: string | null;
  low: boolean;
}

export interface RatingDistribution {
  s: number;
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

export type Province =
  | "Koshi"
  | "Madhesh"
  | "Bagmati"
  | "Gandaki"
  | "Lumbini"
  | "Karnali"
  | "Sudurpashchim";

export interface OrderInbox {
  id: string;
  buyer: string;
  items: number;
  total: number;
  status: string;
  time: string;
  pay: string;
  city: string;
}

export type ScreenId = string;
