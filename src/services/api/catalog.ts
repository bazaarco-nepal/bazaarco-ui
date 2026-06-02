import type {
  Category,
  Product,
  ProductProfile,
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

  getSellerProducts(id: string): Promise<Product[]> {
    return getData<Product[]>(`/catalog/sellers/${id}/products`);
  },

  createSellerReview(id: string, payload: CreateSellerReviewPayload): Promise<SellerReview> {
    return postData<SellerReview>(`/catalog/sellers/${id}/reviews`, payload);
  },

  getProducts(params?: ProductListParams): Promise<PaginatedData<Product>> {
    return getData<PaginatedData<Product>>("/catalog/products", params);
  },

  getTopPicks(params?: TopPicksParams): Promise<PaginatedData<Product>> {
    return getData<PaginatedData<Product>>("/catalog/products/top-picks", params);
  },

  getNewArrivals(params?: PagedParams): Promise<PaginatedData<Product>> {
    return getData<PaginatedData<Product>>("/catalog/products/new-arrivals", params);
  },

  getProduct(id: string): Promise<Product> {
    return getData<Product>(`/catalog/products/${id}`);
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
};
