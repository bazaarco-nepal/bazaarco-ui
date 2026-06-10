import { deleteData, getData, patchData, postData } from "./http";
import type { Product } from "@/types";
import type { StorefrontData } from "./storefront";
import type { OrderStatus } from "@/lib/order-utils";

// What the Add Product form sends. The owning seller is resolved from auth on
// the server; icon/tint are inherited from the category.
export interface CreateProductVariantPayload {
  id: string;
  name: string;
  price: number;
  stock: number;
  // Per-variant discount: `price` is the effective (sale) price, `original` the
  // struck-through pre-discount price. The server is authoritative on the math.
  original?: number | null;
  discountType?: "amount" | "percent" | null;
  discountPct?: number | null;
  allowBargaining?: boolean;
  minimumPrice?: number | null;
  /** Maps dimension name → selected option for multi-dimensional variants. */
  optionValues?: Record<string, string> | null;
  /** Optional Cloudinary URL for a variant-specific photo. */
  imageUrl?: string | null;
}

// Discount fields: `price` is the effective (sale) price, `original` the
// pre-discount price. `discountType`/`discountPct` record the seller's choice;
// the server is authoritative on the numbers (it recomputes percentage prices).
export interface DiscountFields {
  original?: number | null;
  discountType?: "amount" | "percent" | null;
  discountPct?: number | null;
}

export interface UpdateProductPayload extends DiscountFields {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  metadata?: Record<string, unknown>;
  variants?: CreateProductVariantPayload[];
  allowBargaining?: boolean;
  minimumPrice?: number | null;
  // 3–5 gallery images, cover first. Replaces the whole gallery; the server
  // re-derives the cover from images[0]. Omit to leave photos untouched.
  images?: string[];
  variantGroups?: Array<{ name: string; options: string[] }> | null;
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
  // Seller-only bargaining settings (the floor is never sent to buyers), used
  // to prefill the edit form.
  allowBargaining?: boolean;
  minimumPrice?: number | null;
  listingStatus?: "active" | "frozen" | "pending_reinstatement";
  moderationFeedback?: string | null;
  moderationFrozenAt?: string | null;
  sellerAcknowledgedAt?: string | null;
}

export interface SellerOrder {
  id: string;
  buyer: string;
  buyerAvatarUrl: string | null;
  city: string;
  item: string;
  qty: number;
  price: number;
  pay: string;
  status: OrderStatus;
  time: string;
  phone: string;
  icon: string;
  tint: string;
  canCancel: boolean;
  // Multi-seller order: this seller has accepted, but the order stays in
  // "placed" until the other sellers confirm their parcels too.
  awaitingOtherSellers?: boolean;
}

export interface CreateProductPayload extends DiscountFields {
  name: string;
  ne?: string;
  description?: string;
  price: number;
  categoryId: string;
  // 3–5 gallery images, cover first (enforced server-side). `img` is optional
  // and defaults to images[0] on the server.
  images: string[];
  img?: string;
  metadata: Record<string, unknown>;
  stock?: number;
  variants?: CreateProductVariantPayload[];
  allowBargaining?: boolean;
  minimumPrice?: number | null;
  variantGroups?: Array<{ name: string; options: string[] }> | null;
}

export const sellerApi = {
  createProduct(payload: CreateProductPayload): Promise<Product> {
    return postData<Product>("/seller/products", payload);
  },

  updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    return patchData<Product>(`/seller/products/${encodeURIComponent(id)}`, payload);
  },

  acknowledgeProductModeration(id: string): Promise<{
    id: string;
    listingStatus: "pending_reinstatement";
    sellerAcknowledgedAt: string;
  }> {
    return postData(`/seller/products/${encodeURIComponent(id)}/acknowledge-moderation`, {});
  },

  // Hard-deletes the listing and cascades its reviews, Q&A, bargains, wishlist
  // entries and cart lines server-side. Rejected (409) when the product has
  // order history — order records must stay intact, so the UI surfaces the
  // server message instead.
  deleteProduct(id: string): Promise<{ id: string }> {
    return deleteData<{ id: string }>(`/seller/products/${encodeURIComponent(id)}`);
  },

  getDashboard<T = unknown>(range?: string): Promise<T> {
    return getData<T>("/seller/dashboard", range ? { range } : undefined);
  },

  getInbox(): Promise<SellerOrder[]> {
    return getData<SellerOrder[]>("/seller/inbox");
  },

  updateOrderStatus(id: string, status: OrderStatus): Promise<SellerOrder> {
    return patchData<SellerOrder>(`/seller/orders/${encodeURIComponent(id)}/status`, { status });
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
