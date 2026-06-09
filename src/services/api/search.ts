import { apiClient } from "./http";
import type { ApiSuccessResponse } from "./types";
import type { Product } from "@/types";
import { mapProduct } from "./catalog";

export interface SearchParams {
  query: string;
  categories?: string[];
  sellers?: string[];
  price_min?: number;
  price_max?: number;
  rating?: number;
  rating4?: boolean;
  free?: boolean;
  sort?: "relevance" | "price_low" | "price_high" | "rating";
  page?: number;
  limit?: number;
}

export interface SearchProductHit extends Product {
  score: number;
}

export interface Facet {
  value: string;
  count: number;
}

export interface SearchFacets {
  categories: Facet[];
  sellers: Facet[];
  rating: Facet[];
  price?: { min: number; max: number };
}

export interface SearchResponse {
  query: string;
  correction?: string | null;
  page: number;
  limit: number;
  total: number;
  page_count: number;
  search_time_ms?: number;
  facets?: SearchFacets;
  items: SearchProductHit[];
}

export const searchApi = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<SearchResponse>>("/search", params);
    const raw = data.data;
    return { ...raw, items: (raw.items ?? []).map((h) => ({ ...mapProduct(h), score: h.score })) };
  },

  async similar(id: string, limit = 10): Promise<SearchProductHit[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ items: SearchProductHit[] }>>(
      `/search/similar/${encodeURIComponent(id)}`,
      { params: { limit } },
    );
    return (data.data.items ?? []).map((h) => ({ ...mapProduct(h), score: h.score }));
  },
};
