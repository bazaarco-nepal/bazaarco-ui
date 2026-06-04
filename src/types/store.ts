import type { AuthIntent, AuthUser } from "@/types/auth";
import type { CartLine, Product } from "@/types/catalog";
import type { DeliveryLocation } from "@/lib/delivery-location";

export interface BazaarStoreState {
  authed: boolean;
  authReady: boolean;
  user: AuthUser | null;
  /** Last-known role from a previous session, hydrated from storage on boot. */
  roleHint: AuthIntent | null;
  cart: CartLine[];
  wish: string[];
  wishSellers: string[];
  query: string;
  orderTotal: number;
  lastOrderId: string | null;
  activeProduct: Product | null;
  deliveryLocation: DeliveryLocation;
  deliveryHydrated: boolean;
  /** Buyer's contact phone — shared between profile and checkout. */
  buyerPhone: string;
  buyerPhoneHydrated: boolean;
  setAuthed: (authed: boolean) => void;
  setAuthReady: (authReady: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setRoleHint: (role: AuthIntent | null) => void;
  hydrateRoleHint: () => void;
  hydrateBuyerPhone: () => void;
  setBuyerPhone: (phone: string) => void;
  setCart: (cart: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  setWish: (wish: string[] | ((prev: string[]) => string[])) => void;
  setWishSellers: (sellerIds: string[] | ((prev: string[]) => string[])) => void;
  setQuery: (query: string) => void;
  setOrderTotal: (total: number) => void;
  setLastOrderId: (id: string | null) => void;
  setActiveProduct: (product: Product | null) => void;
}
