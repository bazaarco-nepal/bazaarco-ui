import type { CartLine, Product } from "@/types/catalog";
import type { CheckoutPayload, EsewaPaymentInit } from "@/buyer/api/orders";

export type { ToastVariant } from "@/shared/lib/toast";

export interface BazaarContextValue {
  screen: string;
  nav: (screen: string, options?: { cat?: string; product?: string }) => void;
  openProduct: (product: Product, options?: { offer?: boolean }) => void;
  openStore: (sellerId: string) => void;
  /** Open the watch feed; pass a product id to open that reel first. */
  openVideo: (productId?: string) => void;
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
  savedProducts: string[];
  savedSellers: string[];
  toggleSaved: (productId: string, productName?: string) => Promise<void>;
  toggleSavedSeller: (sellerId: string) => Promise<void>;
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
}
