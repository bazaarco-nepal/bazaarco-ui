/**
 * Server-side catalog reads for SEO surfaces (sitemap, per-page metadata).
 *
 * These run in Server Components and route handlers, so they call the Core API
 * host directly (NEXT_PUBLIC_BACKEND_URL) instead of the browser's same-origin `/api/v1`
 * rewrite — a relative URL has no host on the server. They deliberately do NOT
 * reuse the axios `apiClient`, which is browser-shaped (relative base, auth
 * token + zustand interceptors).
 *
 * Every helper fails soft: SEO must never break a page render or the sitemap
 * build, so a backend hiccup is logged and returns null/[], never thrown.
 */
import type { PaginatedData } from "@/services/api/types";

const REVALIDATE_SECONDS = 1800;
const REQUEST_TIMEOUT_MS = 8000;
const PRODUCTS_PAGE_SIZE = 200;
// Hard ceiling so a growing catalog can never blow past the 50k-URL sitemap
// limit or stall the build. Revisit with a sitemap index when we near it.
const MAX_SITEMAP_PRODUCTS = 10_000;

function backendApiBase(): string {
  const host = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ?? "";
  return `${host.replace(/\/$/, "")}/api/v1`;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

async function fetchCatalog<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${backendApiBase()}${path}`, {
      headers: { "Accept-Language": "en" },
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.error(`[seo] catalog GET ${path} -> ${res.status}`);
      return null;
    }
    const body = (await res.json()) as Envelope<T>;
    return body?.data ?? null;
  } catch (error) {
    console.error(`[seo] catalog GET ${path} failed`, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Trim a description to a clean, meta-tag-friendly length. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

// Backend raw shapes — only the fields SEO needs. The catalog API serves
// `coverImageUrl`/`price` (see mapProduct), not the mapped client names.
interface RawProduct {
  id: string;
  name?: string;
  description?: string;
  coverImageUrl?: string;
  img?: string;
  images?: string[];
  price?: number;
  outOfStock?: boolean;
  brand?: string | null;
  sku?: string | null;
  category?: string | null;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  updatedAt?: string;
  createdAt?: string;
}

interface RawSeller {
  id: string;
  slug?: string;
  name?: string;
  avatar?: string;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  updatedAt?: string;
}

export interface ProductSeo {
  name: string;
  description?: string;
  image?: string;
  /** Rupees. */
  price?: number;
  outOfStock?: boolean;
  brand?: string | null;
  sku?: string | null;
  category?: string | null;
  rating?: number;
  reviewCount?: number;
}

export async function fetchProductSeo(id: string): Promise<ProductSeo | null> {
  const p = await fetchCatalog<RawProduct>(`/catalog/products/${encodeURIComponent(id)}`);
  if (!p?.name) return null;
  const price = typeof p.price === "number" ? p.price : undefined;
  return {
    name: p.name,
    description: p.description,
    image: p.coverImageUrl ?? p.img ?? p.images?.[0],
    price,
    outOfStock: p.outOfStock,
    brand: p.brand,
    sku: p.sku,
    category: p.category,
    rating: p.rating,
    reviewCount: p.reviews ?? p.reviewsCount,
  };
}

export interface SellerSeo {
  name: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
}

export async function fetchSellerSeo(id: string): Promise<SellerSeo | null> {
  const s = await fetchCatalog<RawSeller>(`/catalog/sellers/${encodeURIComponent(id)}`);
  if (!s?.name) return null;
  return {
    name: s.name,
    image: s.avatar,
    rating: s.rating,
    reviewCount: s.reviews ?? s.reviewsCount,
  };
}

export interface SitemapEntry {
  path: string;
  lastModified?: string;
}

const TOP_PRODUCTS_LIMIT = 100;

export async function fetchTopProductIds(): Promise<string[]> {
  const data = await fetchCatalog<PaginatedData<RawProduct>>(
    `/catalog/products?page=1&limit=${TOP_PRODUCTS_LIMIT}&sort=popular`,
  );
  if (!data?.items?.length) return [];
  return data.items.filter((p) => p?.id).map((p) => p.id);
}

export async function fetchSitemapProducts(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  for (let page = 1; entries.length < MAX_SITEMAP_PRODUCTS; page++) {
    const data = await fetchCatalog<PaginatedData<RawProduct>>(
      `/catalog/products?page=${page}&limit=${PRODUCTS_PAGE_SIZE}`,
    );
    if (!data?.items?.length) break;
    for (const p of data.items) {
      if (!p?.id) continue;
      entries.push({
        path: `/product/${encodeURIComponent(p.id)}`,
        lastModified: p.updatedAt ?? p.createdAt,
      });
    }
    if (page >= (data.totalPages ?? page)) break;
  }
  return entries.slice(0, MAX_SITEMAP_PRODUCTS);
}

export async function fetchSitemapSellers(): Promise<SitemapEntry[]> {
  const sellers = await fetchCatalog<RawSeller[]>("/catalog/sellers");
  if (!sellers?.length) return [];
  return sellers
    .filter((s) => s?.id)
    .map((s) => ({
      path: `/store/${encodeURIComponent(s.slug ?? s.id)}`,
      lastModified: s.updatedAt,
    }));
}
