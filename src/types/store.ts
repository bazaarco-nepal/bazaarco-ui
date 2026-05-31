import type { AuthUser } from "@/types/auth";
import type { CartLine, Product } from "@/types/catalog";
import type { DeliveryLocation } from "@/lib/delivery-location";

export interface BazaarStoreState {
  authed: boolean;
  user: AuthUser | null;
  cart: CartLine[];
  wish: string[];
  query: string;
  orderTotal: number;
  activeProduct: Product | null;
  deliveryLocation: DeliveryLocation;
  deliveryHydrated: boolean;
  setAuthed: (authed: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setCart: (cart: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  setWish: (wish: string[] | ((prev: string[]) => string[])) => void;
  setQuery: (query: string) => void;
  setOrderTotal: (total: number) => void;
  setActiveProduct: (product: Product | null) => void;
  hydrateDelivery: () => void;
  setDeliveryLocation: (location: DeliveryLocation) => void;
  addToCart: (product: Product, qty?: number) => void;
  toggleWish: (id: string) => void;
}
