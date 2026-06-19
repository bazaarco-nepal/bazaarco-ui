import type { Product } from "@/types";
import { getData, patchData, postData } from "./http";
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
  /** Step 5 — set when a pending offer lapsed because the seller never responded. */
  expiredAt?: string | null;
  /** Step 5 — why it expired, e.g. "seller_no_response". Safe enum; no seller floor. */
  expiryReason?: string | null;
  /** Step 5 — true when the buyer's valid attempt was refunded on expiry. */
  attemptRefunded?: boolean;
  /** Daily bargain attempts left (platform-wide) — present on the create response only. */
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
    expiredAt: raw.expiredAt ?? null,
    expiryReason: raw.expiryReason ?? null,
    attemptRefunded: raw.attemptRefunded === true,
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
    const raw = await patchData<BargainOffer>(`/bargains/${id}/accept`);
    return mapOffer(raw);
  },
  async reject(id: string): Promise<BargainOffer> {
    const raw = await patchData<BargainOffer>(`/bargains/${id}/reject`);
    return mapOffer(raw);
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
    const raw = await patchData<BargainOffer>(`/bargains/${id}/counter`, {
      counter: counterAmount,
    });
    return mapOffer(raw);
  },
};
