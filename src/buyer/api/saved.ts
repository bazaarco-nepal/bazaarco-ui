import { deleteData, getData, postData } from "@/shared/api/http";
import { mapProduct, mapSeller } from "@/shared/api/catalog";
import type { Product, Seller } from "@/types/catalog";

export interface SavedResponse {
  productIds: string[];
  sellerIds: string[];
  products: Product[];
  sellers: Seller[];
}

// The API returns products/sellers in the raw v3 shape (coverImageUrl, reviewsCount).
// Run them through the same mappers the catalog endpoints use so the UI sees
// price/img/reviews — otherwise saved items render with no image.
function mapSaved(raw: SavedResponse): SavedResponse {
  return {
    ...raw,
    products: (raw.products ?? []).map(mapProduct),
    sellers: (raw.sellers ?? []).map(mapSeller),
  };
}

export const savedApi = {
  async get(): Promise<SavedResponse> {
    return mapSaved(await getData<SavedResponse>("/wishlist"));
  },

  async addProduct(productId: string): Promise<SavedResponse> {
    return mapSaved(
      await postData<SavedResponse>(`/wishlist/products/${encodeURIComponent(productId)}`),
    );
  },

  async removeProduct(productId: string): Promise<SavedResponse> {
    return mapSaved(
      await deleteData<SavedResponse>(`/wishlist/products/${encodeURIComponent(productId)}`),
    );
  },

  async addSeller(sellerId: string): Promise<SavedResponse> {
    return mapSaved(
      await postData<SavedResponse>(`/wishlist/sellers/${encodeURIComponent(sellerId)}`),
    );
  },

  async removeSeller(sellerId: string): Promise<SavedResponse> {
    return mapSaved(
      await deleteData<SavedResponse>(`/wishlist/sellers/${encodeURIComponent(sellerId)}`),
    );
  },
};
