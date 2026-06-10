import type { Product } from "@/types";
import { apiClient, getData, postData } from "./http";
import type { ApiSuccessResponse } from "./types";
import { mapProduct } from "./catalog";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOffer(raw: any): BargainOffer {
  const m2r = (v: unknown) => (typeof v === "number" ? v / 100 : 0);
  return {
    ...raw,
    yourOffer: typeof raw.yourOffer === "number" ? raw.yourOffer : m2r(raw.yourOfferMinor),
    listed: typeof raw.listed === "number" ? raw.listed : m2r(raw.listedMinor),
    sellerCounter:
      raw.sellerCounter != null
        ? raw.sellerCounter
        : raw.sellerCounterMinor != null
          ? m2r(raw.sellerCounterMinor)
          : null,
    p: raw.p ? mapProduct(raw.p) : raw.p,
  };
}

export const bargainsApi = {
  async list(): Promise<BargainOffer[]> {
    const raw = await getData<BargainOffer[]>("/bargains");
    return raw.map(mapOffer);
  },
  async create(payload: CreateBargainOfferPayload): Promise<BargainOffer> {
    const raw = await postData<BargainOffer>("/bargains", payload);
    return mapOffer(raw);
  },
  async accept(id: string): Promise<BargainOffer> {
    const { data } = await apiClient.patch<ApiSuccessResponse<BargainOffer>>(
      `/bargains/${id}/accept`,
    );
    return mapOffer(data.data);
  },
  async reject(id: string): Promise<BargainOffer> {
    const { data } = await apiClient.patch<ApiSuccessResponse<BargainOffer>>(
      `/bargains/${id}/reject`,
    );
    return mapOffer(data.data);
  },
  /**
   * Buyer accepts the seller's counter. This is what arms the offer for
   * redemption at checkout — adding to cart alone never did.
   */
  async acceptCounter(id: string): Promise<BargainOffer> {
    const raw = await postData<BargainOffer>(
      `/bargains/${encodeURIComponent(id)}/accept-counter`,
      {},
    );
    return mapOffer(raw);
  },
  async counter(id: string, counterAmount: number): Promise<BargainOffer> {
    const { data } = await apiClient.patch<ApiSuccessResponse<BargainOffer>>(
      `/bargains/${id}/counter`,
      { counter: counterAmount },
    );
    return mapOffer(data.data);
  },
};
