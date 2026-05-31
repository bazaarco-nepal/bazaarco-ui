import type { CartLine, Product } from "@/types/catalog";

export interface BazaarStoreState {
  authed: boolean;
  cart: CartLine[];
  wish: string[];
  query: string;
  orderTotal: number;
  activeProduct: Product | null;
  setAuthed: (authed: boolean) => void;
  setCart: (cart: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  setWish: (wish: string[] | ((prev: string[]) => string[])) => void;
  setQuery: (query: string) => void;
  setOrderTotal: (total: number) => void;
  setActiveProduct: (product: Product | null) => void;
  addToCart: (product: Product, qty?: number) => void;
  toggleWish: (id: string) => void;
}
