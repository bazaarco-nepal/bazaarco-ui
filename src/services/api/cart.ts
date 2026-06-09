import { deleteData, getData, patchData, postData } from "./http";
import type { CartLine } from "@/types/catalog";
import { mapProduct } from "./catalog";

export interface CartResponse {
  items: CartLine[];
}

function mapCartResponse(raw: { items: unknown[] }): CartResponse {
  return {
    items: (raw.items ?? []).map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = item as any;
      const m2r = (v: unknown) => (typeof v === "number" ? v / 100 : 0);
      return {
        ...mapProduct(r),
        qty: r.qty,
        variantId: r.variantId ?? null,
        variantName: r.variantName ?? null,
        // Map unitPriceMinor to price if present (cart line-level price override)
        price:
          typeof r.unitPriceMinor === "number"
            ? m2r(r.unitPriceMinor)
            : typeof r.price === "number"
              ? r.price
              : m2r(r.priceMinor),
      } as CartLine;
    }),
  };
}

export const cartApi = {
  async get(): Promise<CartResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapCartResponse(await getData<any>("/cart"));
  },

  async addItem(productId: string, quantity = 1, variantId?: string | null): Promise<CartResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapCartResponse(await postData<any>("/cart/items", { productId, quantity, variantId }));
  },

  async updateItem(
    productId: string,
    quantity: number,
    variantId?: string | null,
  ): Promise<CartResponse> {
    return mapCartResponse(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await patchData<any>(`/cart/items/${encodeURIComponent(productId)}`, {
        quantity,
        variantId,
      }),
    );
  },

  async removeItem(productId: string, variantId?: string | null): Promise<CartResponse> {
    const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
    return mapCartResponse(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await deleteData<any>(`/cart/items/${encodeURIComponent(productId)}${qs}`),
    );
  },

  async clear(): Promise<CartResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapCartResponse(await deleteData<any>("/cart"));
  },
};
