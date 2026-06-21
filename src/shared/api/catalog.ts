import type {
  Category,
  Product,
  ProductProfile,
  ProductQuestion,
  ProductReview,
  ProductReviewEligibility,
  RatingDistribution,
  Seller,
  SellerReview,
  SellerTrust,
} from "@/types";
import type { PaginatedData } from "./types";
import { getData, postData } from "./http";

export interface CreateSellerReviewPayload {
  stars: number;
  text: string;
  product?: string;
}

export interface CreateProductReviewPayload {
  rating: number;
  text: string;
  photoUrls?: string[];
}

export interface CreateProductQuestionPayload {
  text: string;
  // Only sent for guests; signed-in users are identified server-side.
  askerName?: string;
}

/**
 * Normalize a raw v3 API product into the UI `Product` shape.
 *
 * Money arrives as rupees; this only maps a few backend field names (coverImageUrl,
 * reviewsCount, …) onto the UI's existing names so no component needs to change.
 *
 * v3 → UI mappings (price/original already arrive as rupees):
 *   coverImageUrl            → img
 *   reviewsCount             → reviews
 *   storeId                  → seller  (also kept as storeId)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProduct(raw: any): Product {
  const product: Product = {
    ...raw,
    price: raw.price,
    original: raw.original ?? undefined,
    // field renames
    seller: raw.seller ?? raw.storeId ?? "",
    img: raw.img ?? raw.coverImageUrl ?? undefined,
    reviews: raw.reviews ?? raw.reviewsCount ?? 0,
    category: raw.category ?? undefined,
    // Inline seller snapshot from product detail endpoint
    sellerInfo: raw.store
      ? {
          id: raw.store.id,
          name: raw.store.name,
          avatar: raw.store.avatar,
          rating: raw.store.rating,
          reviews: raw.store.reviewsCount ?? raw.store.reviews ?? 0,
        }
      : undefined,
    // Derive outOfStock
    outOfStock:
      typeof raw.outOfStock === "boolean"
        ? raw.outOfStock
        : typeof raw.stock === "number"
          ? raw.stock <= 0
          : false,
  };

  return product;
}

function mapProductPage(page: PaginatedData<Product>): PaginatedData<Product> {
  return { ...page, items: page.items.map(mapProduct) };
}

export interface ProductListParams {
  category?: string;
  hasVideo?: boolean;
  onSale?: boolean;
  bargainable?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}

/** Faceted browse params — the Postgres-backed listing used when there's no
 *  typed query (so browsing never costs an Algolia search op). */
export interface BrowseParams {
  categories?: string[];
  sellers?: string[];
  price_min?: number;
  price_max?: number;
  rating?: number;
  sort?: "relevance" | "newest" | "price_low" | "price_high" | "rating";
  page?: number;
  limit?: number;
}

export interface BrowseFacet {
  value: string;
  count: number;
}

export interface BrowseResponse extends PaginatedData<Product> {
  facets?: { categories: BrowseFacet[]; sellers: BrowseFacet[] };
}

export interface TopPicksParams {
  days?: number;
  page?: number;
  limit?: number;
}

export interface PagedParams {
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSeller(raw: any): Seller {
  return {
    ...raw,
    reviews: raw.reviews ?? raw.reviewsCount ?? 0,
    city: raw.city ?? "",
    tint: raw.tint ?? "blue",
  };
}

export const catalogApi = {
  getCategories(): Promise<Category[]> {
    return getData<Category[]>("/catalog/categories");
  },

  async getSellers(): Promise<Seller[]> {
    const raw = await getData<Seller[]>("/catalog/sellers");
    return raw.map(mapSeller);
  },

  async getSeller(id: string): Promise<Seller> {
    return mapSeller(await getData<Seller>(`/catalog/sellers/${id}`));
  },

  getSellerReviews(id: string): Promise<SellerReview[]> {
    return getData<SellerReview[]>(`/catalog/sellers/${id}/reviews`);
  },

  async getSellerProducts(id: string): Promise<Product[]> {
    const items = await getData<Product[]>(`/catalog/sellers/${id}/products`);
    return items.map(mapProduct);
  },

  getSellerTrust(id: string): Promise<SellerTrust> {
    return getData<SellerTrust>(`/catalog/sellers/${id}/trust`);
  },

  createSellerReview(id: string, payload: CreateSellerReviewPayload): Promise<SellerReview> {
    return postData<SellerReview>(`/catalog/sellers/${id}/reviews`, payload);
  },

  async getProducts(params?: ProductListParams): Promise<PaginatedData<Product>> {
    return mapProductPage(await getData<PaginatedData<Product>>("/catalog/products", params));
  },

  /** Faceted browse listing (Postgres). Arrays are comma-joined for the query
   *  string; `facets=true` asks the API for category/seller counts. */
  async browseProducts(params: BrowseParams): Promise<BrowseResponse> {
    const query: Record<string, string | number | boolean> = {
      facets: true,
      page: params.page ?? 1,
      limit: params.limit ?? 24,
    };
    if (params.categories?.length) query.categories = params.categories.join(",");
    if (params.sellers?.length) query.sellers = params.sellers.join(",");
    if (params.price_min != null) query.price_min = params.price_min;
    if (params.price_max != null) query.price_max = params.price_max;
    if (params.rating != null) query.rating = params.rating;
    if (params.sort) query.sort = params.sort;
    const raw = await getData<BrowseResponse>("/catalog/products", query);
    return { ...raw, items: raw.items.map(mapProduct) };
  },

  async getTopPicks(params?: TopPicksParams): Promise<PaginatedData<Product>> {
    return mapProductPage(
      await getData<PaginatedData<Product>>("/catalog/products/top-picks", params),
    );
  },

  async getNewArrivals(params?: PagedParams): Promise<PaginatedData<Product>> {
    return mapProductPage(
      await getData<PaginatedData<Product>>("/catalog/products/new-arrivals", params),
    );
  },

  async getProduct(id: string): Promise<Product> {
    return mapProduct(await getData<Product>(`/catalog/products/${id}`));
  },

  getProductReviews(id: string): Promise<ProductReview[]> {
    return getData<ProductReview[]>(`/catalog/products/${id}/reviews`);
  },

  getProductProfile(id: string): Promise<ProductProfile> {
    return getData<ProductProfile>(`/catalog/products/${id}/profile`);
  },

  getRatingDistribution(id: string): Promise<RatingDistribution[]> {
    return getData<RatingDistribution[]>(`/catalog/products/${id}/rating-distribution`);
  },

  getProductReviewEligibility(id: string): Promise<ProductReviewEligibility> {
    return getData<ProductReviewEligibility>(`/catalog/products/${id}/review-eligibility`);
  },

  createProductReview(id: string, payload: CreateProductReviewPayload): Promise<ProductReview> {
    return postData<ProductReview>(`/catalog/products/${id}/reviews`, payload);
  },

  getProductQuestions(id: string, params?: PagedParams): Promise<PaginatedData<ProductQuestion>> {
    return getData<PaginatedData<ProductQuestion>>(`/catalog/products/${id}/questions`, params);
  },

  createProductQuestion(
    id: string,
    payload: CreateProductQuestionPayload,
  ): Promise<ProductQuestion> {
    return postData<ProductQuestion>(`/catalog/products/${id}/questions`, payload);
  },
};
