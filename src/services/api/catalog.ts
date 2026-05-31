import type {
  Category,
  CategoryAttributeField,
  Product,
  ProductProfile,
  ProductReview,
  RatingDistribution,
  Seller,
} from "@/types";
import type { PaginatedData } from "./types";
import { getData } from "./http";

export interface ProductListParams {
  category?: string;
  hasVideo?: boolean;
  onSale?: boolean;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CategoryAttributeRow {
  id: string;
  fields: CategoryAttributeField[];
}

export const catalogApi = {
  getCategories(): Promise<Category[]> {
    return getData<Category[]>("/catalog/categories");
  },

  getAttrCategories() {
    return getData<Array<{ id: string; en: string; ne: string; icon: string }>>(
      "/catalog/attr-categories",
    );
  },

  async getCategoryAttributesMap(): Promise<Record<string, CategoryAttributeField[]>> {
    const rows = await getData<CategoryAttributeRow[]>("/catalog/category-attributes");
    return Object.fromEntries(rows.map((row) => [row.id, row.fields]));
  },

  getSellers(): Promise<Seller[]> {
    return getData<Seller[]>("/catalog/sellers");
  },

  getSeller(id: string): Promise<Seller> {
    return getData<Seller>(`/catalog/sellers/${id}`);
  },

  getProducts(params?: ProductListParams): Promise<PaginatedData<Product>> {
    return getData<PaginatedData<Product>>("/catalog/products", params);
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
