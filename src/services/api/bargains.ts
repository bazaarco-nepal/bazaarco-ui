import type { Product } from "@/types";
import { apiClient, getData, postData } from "./http";
import type { ApiSuccessResponse } from "./types";
import { mapProduct } from "./catalog";

export interface BargainOffer {
  id: string;
  productId: string;
  /** The variant the offer was made on — a redeemed deal only applies to this cart line. */
  variantId: string | null;
  variantName: string | null;
  yourOffer: number;
  listed: number;
  sellerCounter: number | null;
  /** The price the deal closed at — set only once accepted. */
  agreed: number | null;
  status: string;
  age: string;
  expires: string | null;
  /** Daily bargain attempts left on this product — present on the create response only. */
  attemptsRemaining?: number;
  p: Product;
}

export interface CreateBargainOfferPayload {
  productId: string;
  variantId?: string | null;
  yourOffer: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOffer(raw: any): BargainOffer {
  // The API speaks rupees; only `p` (the product) needs the shared field-rename mapper.
  return {
    ...raw,
    variantId: raw.variantId ?? null,
    variantName: raw.variantName ?? null,
    sellerCounter: raw.sellerCounter ?? null,
    agreed: raw.agreed ?? null,
    attemptsRemaining:
      typeof raw.attemptsRemaining === "number" ? raw.attemptsRemaining : undefined,
    p: raw.p ? mapProduct(raw.p) : raw.p,
  };
}

export const bargainsApi = {
  async list(): Promise<BargainOffer[]> {
    const raw = await getData<BargainOffer[]>("/bargains");
    return raw.map(mapOffer);
  },
  /** How many other buyers are actively bargaining on this product (hot-item badge). */
  async activity(productId: string): Promise<number> {
    const data = await getData<{ activeBargainers: number }>(
      `/bargains/activity/${encodeURIComponent(productId)}`,
    );
    return typeof data.activeBargainers === "number" ? data.activeBargainers : 0;
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
