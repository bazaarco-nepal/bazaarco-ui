import { apiClient } from "./http";
import type { ApiSuccessResponse } from "./types";
import type { Product } from "@/types";

export interface SearchParams {
  query: string;
  categories?: string[];
  price_min?: number;
  price_max?: number;
  verified?: boolean;
  rating4?: boolean;
  free?: boolean;
  sort?: "relevance" | "price_low" | "price_high" | "rating";
  page?: number;
  limit?: number;
}

export interface SearchProductHit extends Product {
  score: number;
}

export interface SearchResponse {
  query: string;
  page: number;
  limit: number;
  total: number;
  page_count: number;
  items: SearchProductHit[];
}

export const searchApi = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<SearchResponse>>("/search", params);
    return data.data;
  },
};
