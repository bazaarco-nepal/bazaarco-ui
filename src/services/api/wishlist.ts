import { deleteData, getData, postData } from "./http";
import { mapProduct, mapSeller } from "./catalog";
import type { Product, Seller } from "@/types/catalog";

export interface WishlistResponse {
  productIds: string[];
  sellerIds: string[];
  products: Product[];
  sellers: Seller[];
}

// The API returns products/sellers in the raw v3 shape (priceMinor, coverImageUrl,
// reviewsCount). Run them through the same mappers the catalog endpoints use so the
// UI sees price/img/reviews — otherwise saved items render as Rs. 0 with no image.
function mapWishlist(raw: WishlistResponse): WishlistResponse {
  return {
    ...raw,
    products: (raw.products ?? []).map(mapProduct),
    sellers: (raw.sellers ?? []).map(mapSeller),
  };
}

export const wishlistApi = {
  async get(): Promise<WishlistResponse> {
    return mapWishlist(await getData<WishlistResponse>("/wishlist"));
  },

  async addProduct(productId: string): Promise<WishlistResponse> {
    return mapWishlist(
      await postData<WishlistResponse>(`/wishlist/products/${encodeURIComponent(productId)}`),
    );
  },

  async removeProduct(productId: string): Promise<WishlistResponse> {
    return mapWishlist(
      await deleteData<WishlistResponse>(`/wishlist/products/${encodeURIComponent(productId)}`),
    );
  },

  async addSeller(sellerId: string): Promise<WishlistResponse> {
    return mapWishlist(
      await postData<WishlistResponse>(`/wishlist/sellers/${encodeURIComponent(sellerId)}`),
    );
  },

  async removeSeller(sellerId: string): Promise<WishlistResponse> {
    return mapWishlist(
      await deleteData<WishlistResponse>(`/wishlist/sellers/${encodeURIComponent(sellerId)}`),
    );
  },
};
