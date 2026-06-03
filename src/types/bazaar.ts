import type { CartLine, Product } from "@/types/catalog";
import type { CheckoutPayload } from "@/services/api/orders";

export interface BazaarToast {
  msg: string;
  id: number;
}

export interface BazaarContextValue {
  screen: string;
  nav: (screen: string, options?: { cat?: string }) => void;
  openProduct: (product: Product) => void;
  openStore: (sellerId: string) => void;
  openTracking: (orderId: string) => void;
  cart: CartLine[];
  cartLoading: boolean;
  addToCart: (product: Product, qty?: number, successMessage?: string) => Promise<void>;
  updateCartQty: (productId: string, qty: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  buyNow: (product: Product, qty?: number) => Promise<void>;
  cartCount: number;
  wish: string[];
  wishSellers: string[];
  toggleWish: (productId: string) => Promise<void>;
  toggleSellerWish: (sellerId: string) => Promise<void>;
  toast: (msg: string) => void;
  promptLogin: (message?: string) => void;
  query: string;
  setQuery: (query: string) => void;
  submitSearch: () => void;
  placeOrder: (payload: CheckoutPayload) => Promise<void>;
  authed: boolean;
  setAuthed: (authed: boolean) => void;
  product: Product | null;
  toastMsg: BazaarToast | null;
}
