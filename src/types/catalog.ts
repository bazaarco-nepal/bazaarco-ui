export type Tint = "red" | "blue" | "saffron" | "purple" | "slate" | "green" | "gold" | "teal";

export interface Category {
  id: string;
  en: string;
  ne: string;
  icon: string;
  tint: Tint;
  img: string;
}

export interface AttrCategory {
  id: string;
  en: string;
  ne: string;
  icon: string;
}

export type CategoryAttributeType = "select" | "multi" | "text" | "num" | "toggle" | "date";

export interface CategoryAttributeField {
  k: string;
  en: string;
  ne: string;
  t: CategoryAttributeType;
  req?: boolean;
  o?: string[];
  u?: string;
  help?: string;
}

export interface Seller {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviews: number;
  city: string;
  tint: Tint;
  avatar: string;
}

export interface Product {
  id: string;
  name: string;
  ne?: string;
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
  lowStock?: number;
  outOfStock?: boolean;
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
  avatar: string;
  tint: Tint;
}

export interface RatingDistribution {
  s: number;
  pct: number;
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
