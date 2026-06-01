import type { AuthUser } from "@/types/auth";
import type { CartLine, Product } from "@/types/catalog";

export interface BazaarStoreState {
  authed: boolean;
  user: AuthUser | null;
  cart: CartLine[];
  wish: string[];
  wishSellers: string[];
  query: string;
  orderTotal: number;
  lastOrderId: string | null;
  activeProduct: Product | null;
  setAuthed: (authed: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setCart: (cart: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  setWish: (wish: string[] | ((prev: string[]) => string[])) => void;
  setWishSellers: (sellerIds: string[] | ((prev: string[]) => string[])) => void;
  setQuery: (query: string) => void;
  setOrderTotal: (total: number) => void;
  setLastOrderId: (id: string | null) => void;
  setActiveProduct: (product: Product | null) => void;
}
