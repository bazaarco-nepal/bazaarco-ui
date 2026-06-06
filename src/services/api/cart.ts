import { deleteData, getData, patchData, postData } from "./http";
import type { CartLine } from "@/types/catalog";

export interface CartResponse {
  items: CartLine[];
}

export const cartApi = {
  get(): Promise<CartResponse> {
    return getData<CartResponse>("/cart");
  },

  addItem(productId: string, quantity = 1, variantId?: string | null): Promise<CartResponse> {
    return postData<CartResponse>("/cart/items", { productId, quantity, variantId });
  },

  updateItem(
    productId: string,
    quantity: number,
    variantId?: string | null,
  ): Promise<CartResponse> {
    return patchData<CartResponse>(`/cart/items/${encodeURIComponent(productId)}`, {
      quantity,
      variantId,
    });
  },

  removeItem(productId: string, variantId?: string | null): Promise<CartResponse> {
    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
    return deleteData<CartResponse>(`/cart/items/${encodeURIComponent(productId)}${qs}`);
  },

  clear(): Promise<CartResponse> {
    return deleteData<CartResponse>("/cart");
  },
};
