import type { CartLine, Product } from "@/types/catalog";

export interface BazaarToast {
  msg: string;
  id: number;
}

export interface BazaarContextValue {
  screen: string;
  nav: (screen: string) => void;
  openProduct: (product: Product) => void;
  cart: CartLine[];
  setCart: (cart: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  addToCart: (product: Product, qty?: number) => void;
  buyNow: (product: Product, qty?: number) => void;
  cartCount: number;
  wish: string[];
  toggleWish: (id: string) => void;
  toast: (msg: string) => void;
  query: string;
  setQuery: (query: string) => void;
  placeOrder: (total: number) => void;
  authed: boolean;
  setAuthed: (authed: boolean) => void;
  product: Product | null;
  toastMsg: BazaarToast | null;
}
