import { getData } from "./http";

export interface OrderRider {
  name: string;
  eta: string;
}

export interface Order {
  id: string;
  status: string;
  placed: string;
  eta: string;
  total: number;
  items: string[];
  rider?: OrderRider;
}

export const ordersApi = {
  list(): Promise<Order[]> {
    return getData<Order[]>("/orders");
  },

  getById(id: string): Promise<Order> {
    return getData<Order>(`/orders/${id}`);
  },
};
