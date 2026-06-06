import type { Product } from "@/types";
import { apiClient, getData, postData } from "./http";
import type { ApiSuccessResponse } from "./types";

export interface BargainOffer {
  id: string;
  productId: string;
  yourOffer: number;
  listed: number;
  sellerCounter: number | null;
  status: string;
  age: string;
  expires: string | null;
  p: Product;
}

export interface CreateBargainOfferPayload {
  productId: string;
  variantId?: string | null;
  yourOffer: number;
}

export const bargainsApi = {
  list(): Promise<BargainOffer[]> {
    return getData<BargainOffer[]>("/bargains");
  },
  create(payload: CreateBargainOfferPayload): Promise<BargainOffer> {
    return postData<BargainOffer>("/bargains", payload);
  },
  async accept(id: string): Promise<BargainOffer> {
    const { data } = await apiClient.patch<ApiSuccessResponse<BargainOffer>>(
      `/bargains/${id}/accept`,
    );
    return data.data;
  },
  async reject(id: string): Promise<BargainOffer> {
    const { data } = await apiClient.patch<ApiSuccessResponse<BargainOffer>>(
      `/bargains/${id}/reject`,
    );
    return data.data;
  },
  async counter(id: string, counterAmount: number): Promise<BargainOffer> {
    const { data } = await apiClient.patch<ApiSuccessResponse<BargainOffer>>(
      `/bargains/${id}/counter`,
      { counter: counterAmount },
    );
    return data.data;
  },
};
