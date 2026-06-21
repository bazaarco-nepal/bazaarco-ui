import { apiClient } from "@/shared/api/http";
import type { ApiSuccessResponse } from "@/shared/api/types";
import type { Product } from "@/types";
import { mapProduct } from "@/shared/api/catalog";

export interface SearchParams {
  query: string;
  categories?: string[];
  sellers?: string[];
  price_min?: number;
  price_max?: number;
  rating?: number;
  rating4?: boolean;
  sort?: "relevance" | "newest" | "price_low" | "price_high" | "rating";
  page?: number;
  limit?: number;
}

export interface Facet {
  value: string;
  count: number;
}

export interface SearchFacets {
  categories: Facet[];
  sellers: Facet[];
}

export interface SearchResponse {
  query: string;
  page: number;
  limit: number;
  total: number;
  page_count: number;
  search_time_ms?: number;
  facets?: SearchFacets;
  items: Product[];
}

export const searchApi = {
  async similar(id: string, limit = 10): Promise<Product[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ items: Product[] }>>(
      `/search/similar/${encodeURIComponent(id)}`,
      { params: { limit } },
    );
    return (data.data.items ?? []).map((h) => mapProduct(h));
  },
};
