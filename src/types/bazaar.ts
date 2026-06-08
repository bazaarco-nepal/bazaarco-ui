import type { CartLine, Product } from "@/types/catalog";
import type { CheckoutPayload } from "@/services/api/orders";
import type { ToastVariant } from "@/lib/toast-variant";

export type { ToastVariant };

export interface BazaarToast {
  msg: string;
  id: number;
  variant: ToastVariant;
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
    variantId?: string | null,
  ) => Promise<void>;
  updateCartQty: (productId: string, qty: number, variantId?: string | null) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string | null) => Promise<void>;
  buyNow: (product: Product, qty?: number, variantId?: string | null) => Promise<void>;
  cartCount: number;
  wish: string[];
  wishSellers: string[];
  toggleWish: (productId: string) => Promise<void>;
  toggleSellerWish: (sellerId: string) => Promise<void>;
  toast: (msg: string, variant?: ToastVariant) => void;
  promptLogin: (message?: string) => void;
  query: string;
  setQuery: (query: string) => void;
  submitSearch: () => void;
  clearSearch: () => void;
  placeOrder: (payload: CheckoutPayload) => Promise<void>;
  authed: boolean;
  setAuthed: (authed: boolean) => void;
  product: Product | null;
  toastMsg: BazaarToast | null;
}
