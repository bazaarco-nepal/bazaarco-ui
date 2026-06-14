import type { Product } from "@/types";
import type { Tint } from "@/types";

type AlgoliaRecord = Record<string, unknown> & {
  _highlightResult?: { name?: { value?: string } };
};

export interface AlgoliaProductDocument {
  id: string;
  name: string;
  description: string;
  seller_name: string;
  seller_verified: boolean;
  category: string;
  price: number;
  original?: number;
  rating: number;
  reviews_count: number;
  img: string;
}

export function toSearchDocument(record: Record<string, unknown>): AlgoliaProductDocument {
  return {
    id: String(record.objectID ?? ""),
    name: String(record.name ?? ""),
    description: String(record.description ?? ""),
    seller_name: String(record.seller_name ?? ""),
    seller_verified: Boolean(record.seller_verified),
    category: String(record.category ?? ""),
    price: Number(record.price ?? 0),
    ...(record.original != null ? { original: Number(record.original) } : {}),
    rating: Number(record.rating ?? 0),
    reviews_count: Number(record.reviews_count ?? 0),
    img: String(record.img ?? ""),
  };
}

/** Map an Algolia hit to the UI search card shape (prices in rupees). */
export function toSearchProductHit(record: AlgoliaRecord): Product {
  const document = toSearchDocument(record);

  return {
    id: document.id,
    name: document.name,
    description: document.description,
    price: document.price,
    original: document.original ?? undefined,
    cat: document.category,
    seller: document.seller_name,
    icon: "box",
    tint: "slate" as Tint,
    rating: document.rating,
    reviews: document.reviews_count,
    img: document.img || undefined,
    eta: "2–3 days",
  };
}
