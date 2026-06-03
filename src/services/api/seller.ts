import { getData, patchData, postData } from "./http";
import type { Product } from "@/types";
import type { StorefrontData } from "./storefront";

// What the Add Product form sends. The owning seller is resolved from auth on
// the server; icon/tint are inherited from the category.
export interface CreateProductVariantPayload {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  original?: number | null;
  stock?: number;
  metadata?: Record<string, unknown>;
  variants?: CreateProductVariantPayload[];
  allowBargaining?: boolean;
  maxDiscountPct?: number;
}

export interface SellerInventoryItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  img?: string | null;
  images?: string[];
  hasVariants?: boolean;
  variants?: CreateProductVariantPayload[];
  icon: string;
  tint: string;
}

export interface CreateProductPayload {
  name: string;
  ne?: string;
  description?: string;
  price: number;
  original?: number | null;
  categoryId: string;
  // 3–5 gallery images, cover first (enforced server-side). `img` is optional
  // and defaults to images[0] on the server.
  images: string[];
  img?: string;
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

  updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    return patchData<Product>(`/seller/products/${encodeURIComponent(id)}`, payload);
  },

  getDashboard<T = unknown>(): Promise<T> {
    return getData<T>("/seller/dashboard");
  },

  getInbox<T = unknown>(): Promise<T> {
    return getData<T>("/seller/inbox");
  },

  getInventory(): Promise<SellerInventoryItem[]> {
    return getData<SellerInventoryItem[]>("/seller/inventory");
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
