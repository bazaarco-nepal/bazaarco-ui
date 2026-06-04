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

export interface CheckoutPayload {
  phone: string;
  paymentMethod: "cod";
  addressId?: string;
  deliveryAddress?: DeliveryAddress;
  saveAddress?: {
    label: string;
    isDefault?: boolean;
  };
}

export interface Order {
  id: string;
  status: string;
  placed: string;
  eta: string;
  total: number;
  items: string[];
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
