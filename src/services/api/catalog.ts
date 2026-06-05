import type {
  Category,
  Product,
  ProductProfile,
  ProductQuestion,
  ProductReview,
  RatingDistribution,
  Seller,
  SellerReview,
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
 * Normalize a product as it arrives from the API. Core now emits
 * `outOfStock: boolean` directly; honor it when present and otherwise derive it
 * from the numeric `stock` field (`stock <= 0`) so sold-out items are reliably
 * excluded by the home/browse `!outOfStock` filters. `stock` is dropped — the UI
 * `Product` type carries `outOfStock`, not raw stock.
 */
export function mapProduct(raw: Product & { stock?: number }): Product {
  const { stock, ...rest } = raw;
  const product = rest as Product;
  if (typeof product.outOfStock === "boolean") return product;
  if (typeof stock === "number") product.outOfStock = stock <= 0;
  return product;
}

function mapProductPage(page: PaginatedData<Product>): PaginatedData<Product> {
  return { ...page, items: page.items.map(mapProduct) };
}

export interface ProductListParams {
  category?: string;
  hasVideo?: boolean;
  onSale?: boolean;
  q?: string;
  page?: number;
  limit?: number;
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

export const catalogApi = {
  getCategories(): Promise<Category[]> {
    return getData<Category[]>("/catalog/categories");
  },

  getSellers(): Promise<Seller[]> {
    return getData<Seller[]>("/catalog/sellers");
  },

  getSeller(id: string): Promise<Seller> {
    return getData<Seller>(`/catalog/sellers/${id}`);
  },

  getSellerReviews(id: string): Promise<SellerReview[]> {
    return getData<SellerReview[]>(`/catalog/sellers/${id}/reviews`);
  },

  async getSellerProducts(id: string): Promise<Product[]> {
    const items = await getData<Product[]>(`/catalog/sellers/${id}/products`);
    return items.map(mapProduct);
  },

  createSellerReview(id: string, payload: CreateSellerReviewPayload): Promise<SellerReview> {
    return postData<SellerReview>(`/catalog/sellers/${id}/reviews`, payload);
  },

  async getProducts(params?: ProductListParams): Promise<PaginatedData<Product>> {
    return mapProductPage(await getData<PaginatedData<Product>>("/catalog/products", params));
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
