import { postData } from "@/shared/api/http";

export const buyerEventTypes = [
  "product_impression",
  "product_opened",
  "pdp_duration",
  "variant_selected",
  "video_watched_80",
  "search_performed",
  "search_result_clicked",
  "seller_profile_opened",
  "delivery_checked",
  "added_to_cart",
  "cart_item_removed",
  "bargain_offer_submitted",
  "checkout_started",
  "product_purchased",
] as const;

export type BuyerEventType = (typeof buyerEventTypes)[number];

export interface BuyerEventPayload {
  eventType: BuyerEventType;
  productId?: string | null;
  variantId?: string | null;
  storeId?: string | null;
  categoryId?: string | null;
  videoId?: string | null;
  cartItemId?: string | null;
  bargainOfferId?: string | null;
  orderId?: string | null;
  orderItemId?: string | null;
  quantity?: number | null;
  price?: number | null;
  sourcePage?: string | null;
  sourceSection?: string | null;
  sourcePosition?: number | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
}

export const buyerEventsApi = {
  record(payload: BuyerEventPayload): Promise<{ recorded: boolean }> {
    return postData("/buyer-events", payload);
  },
};
