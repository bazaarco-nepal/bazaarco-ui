import { getData, postData } from "./http";

export interface OrderRider {
  name: string;
  eta: string;
}

export interface DeliveryAddress {
  city: string;
  area: string;
  landmark: string;
}

export type DeliveryTier = "standard" | "premium";

export interface CheckoutPayload {
  phone: string;
  paymentMethod: "cod";
  /** Speed chosen by the customer; combined pricing is resolved server-side. */
  deliveryTier?: DeliveryTier;
  addressId?: string;
  deliveryAddress?: DeliveryAddress;
  saveAddress?: {
    label: string;
    isDefault?: boolean;
  };
}

export interface OrderLineItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  placed: string;
  eta: string;
  total: number;
  items: string[];
  /** Per-line quantities; unit price is resolved from the catalog client-side. */
  lineItems?: OrderLineItem[];
  /** Customer-chosen speed tier. */
  deliveryTier?: DeliveryTier | null;
  /** Resolved option key: standard | combined_standard | premium | combined_premium. */
  deliveryType?: string | null;
  /** Charged delivery fee (Rs), already included in `total`. */
  deliveryFee?: number | null;
  canCancel?: boolean;
  phone?: string | null;
  paymentMethod?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  rider?: OrderRider;
}

export const ordersApi = {
  list(): Promise<Order[]> {
    return getData<Order[]>("/orders");
  },

  getById(id: string): Promise<Order> {
    return getData<Order>(`/orders/${id}`);
  },

  checkout(payload: CheckoutPayload): Promise<Order> {
    return postData<Order>("/orders/checkout", payload);
  },

  cancel(id: string): Promise<Order> {
    return postData<Order>(`/orders/${id}/cancel`);
  },
};
