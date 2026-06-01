import { getData, postData } from "./http";
import type { StorefrontData } from "./storefront";
import type { Product } from "@/types";

// What the Add Product form sends. The owning seller is resolved from auth on
// the server; icon/tint are inherited from the category.
export interface CreateProductVariantPayload {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CreateProductPayload {
  name: string;
  ne?: string;
  description?: string;
  price: number;
  original?: number | null;
  categoryId: string;
  img: string;
  metadata: Record<string, unknown>;
  stock?: number;
  variants?: CreateProductVariantPayload[];
  allowBargaining?: boolean;
  maxDiscountPct?: number;
}

export const sellerApi = {
  createProduct(payload: CreateProductPayload): Promise<Product> {
    return postData<Product>("/seller/products", payload);
  },

  getDashboard<T = unknown>(): Promise<T> {
    return getData<T>("/seller/dashboard");
  },

  getInbox<T = unknown>(): Promise<T> {
    return getData<T>("/seller/inbox");
  },

  getInventory<T = unknown>(): Promise<T> {
    return getData<T>("/seller/inventory");
  },

  getBargains<T = unknown>(): Promise<T> {
    return getData<T>("/seller/bargains");
  },

  getReviews<T = unknown>(): Promise<T> {
    return getData<T>("/seller/reviews");
  },

  getChat<T = unknown>(): Promise<T> {
    return getData<T>("/seller/chat");
  },

  getPromotions<T = unknown>(): Promise<T> {
    return getData<T>("/seller/promotions");
  },

  getVideos<T = unknown>(): Promise<T> {
    return getData<T>("/seller/videos");
  },

  getAnalytics<T = unknown>(): Promise<T> {
    return getData<T>("/seller/analytics");
  },

  getReports<T = unknown>(): Promise<T> {
    return getData<T>("/seller/reports");
  },

  getNotifications<T = unknown>(): Promise<T> {
    return getData<T>("/seller/notifications");
  },

  getStorefront(): Promise<StorefrontData> {
    return getData<StorefrontData>("/seller/storefront");
  },

  getLedger<T = unknown>(): Promise<T> {
    return getData<T>("/seller/ledger");
  },
};
