import { deleteData, getData, postData } from "./http";
import type { Product, Seller } from "@/types/catalog";

export interface WishlistResponse {
  productIds: string[];
  sellerIds: string[];
  products: Product[];
  sellers: Seller[];
}

export const wishlistApi = {
  get(): Promise<WishlistResponse> {
    return getData<WishlistResponse>("/wishlist");
  },

  addProduct(productId: string): Promise<WishlistResponse> {
    return postData<WishlistResponse>(`/wishlist/products/${encodeURIComponent(productId)}`);
  },

  removeProduct(productId: string): Promise<WishlistResponse> {
    return deleteData<WishlistResponse>(`/wishlist/products/${encodeURIComponent(productId)}`);
  },

  addSeller(sellerId: string): Promise<WishlistResponse> {
    return postData<WishlistResponse>(`/wishlist/sellers/${encodeURIComponent(sellerId)}`);
  },

  removeSeller(sellerId: string): Promise<WishlistResponse> {
    return deleteData<WishlistResponse>(`/wishlist/sellers/${encodeURIComponent(sellerId)}`);
  },
};
