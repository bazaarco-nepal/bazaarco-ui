import { deleteData, getData, patchData, postData } from "./http";
import type { CartLine } from "@/types/catalog";

export interface CartResponse {
  items: CartLine[];
}

export const cartApi = {
  get(): Promise<CartResponse> {
    return getData<CartResponse>("/cart");
  },

  addItem(productId: string, quantity = 1): Promise<CartResponse> {
    return postData<CartResponse>("/cart/items", { productId, quantity });
  },

  updateItem(productId: string, quantity: number): Promise<CartResponse> {
    return patchData<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`, { quantity });
  },

  removeItem(productId: string): Promise<CartResponse> {
    return deleteData<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`);
  },

  clear(): Promise<CartResponse> {
    return deleteData<CartResponse>("/cart");
  },
};
