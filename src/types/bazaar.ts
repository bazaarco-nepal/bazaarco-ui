import type { CartLine, Product } from "@/types/catalog";
import type { CheckoutPayload, EsewaPaymentInit } from "@/services/api/orders";
import type { ToastVariant } from "@/lib/toast-variant";

export type { ToastVariant };

export interface BazaarToast {
  msg: string;
  id: number;
  variant: ToastVariant;
  /**
   * Optional one-tap reversal (wishlist save is the canonical case). When set,
   * the toast renders an "Undo" button that runs this and dismisses itself.
   */
  undo?: () => void;
}

export interface ToastOptions {
  undo?: () => void;
}

export interface BazaarContextValue {
  screen: string;
  nav: (screen: string, options?: { cat?: string }) => void;
  openProduct: (product: Product) => void;
  openStore: (sellerId: string) => void;
  openTracking: (orderId: string) => void;
  cart: CartLine[];
  cartLoading: boolean;
  addToCart: (
    product: Product,
    qty?: number,
    successMessage?: string,
    // One variant, or several at once (grouped-variant products let the buyer
    // pick one option from each group and add them together).
    variantId?: string | null | Array<string | null>,
  ) => Promise<void>;
  updateCartQty: (productId: string, qty: number, variantId?: string | null) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string | null) => Promise<void>;
  buyNow: (
    product: Product,
    qty?: number,
    variantId?: string | null | Array<string | null>,
  ) => Promise<void>;
  cartCount: number;
  wish: string[];
  wishSellers: string[];
  toggleWish: (productId: string) => Promise<void>;
  toggleSellerWish: (sellerId: string) => Promise<void>;
  toast: (msg: string, variant?: ToastVariant, options?: ToastOptions) => void;
  promptLogin: (message?: string) => void;
  query: string;
  setQuery: (query: string) => void;
  /** Submit the current query; pass a category id to scope results to it. */
  submitSearch: (cat?: string) => void;
  clearSearch: () => void;
  placeOrder: (payload: CheckoutPayload) => Promise<void>;
  /** Start an eSewa payment: returns signed gateway form data (or null if not signed in). */
  checkoutEsewa: (payload: CheckoutPayload) => Promise<EsewaPaymentInit | null>;
  authed: boolean;
  setAuthed: (authed: boolean) => void;
  product: Product | null;
  toastMsg: BazaarToast | null;
}
