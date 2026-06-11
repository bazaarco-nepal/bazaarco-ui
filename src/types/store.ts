import type { Locale } from "@/i18n";
import type { AuthIntent, AuthUser } from "@/types/auth";
import type { CartLine, Product } from "@/types/catalog";
import type { DeliveryLocation } from "@/lib/delivery-location";
import type { DeliveryTier } from "@/lib/delivery-options";
import type { CartSelection } from "@/lib/cart-selection";

export interface BazaarStoreState {
  authed: boolean;
  authReady: boolean;
  user: AuthUser | null;
  /** Last-known role from a previous session, hydrated from storage on boot. */
  roleHint: AuthIntent | null;
  cart: CartLine[];
  /** Cart lines chosen for the next checkout. `null` = every line selected. */
  selectedCartIds: CartSelection;
  wish: string[];
  wishSellers: string[];
  query: string;
  /** Optimistic screen while client navigation catches up (e.g. search → browse). */
  screenOverride: string | null;
  orderTotal: number;
  lastOrderId: string | null;
  /** Set when the seller taps "Re-upload document" on the KYC page — lets the
   *  onboarding flow restart even while verification is pending. */
  sellerReuploadIntent: boolean;
  activeProduct: Product | null;
  deliveryLocation: DeliveryLocation;
  deliveryHydrated: boolean;
  /** Buyer's contact phone — shared between profile and checkout. */
  buyerPhone: string;
  buyerPhoneHydrated: boolean;
  /** Customer-chosen delivery speed; shared between Cart summary and Checkout. */
  deliveryTier: DeliveryTier;
  locale: Locale;
  localeHydrated: boolean;
  setAuthed: (authed: boolean) => void;
  setAuthReady: (authReady: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setRoleHint: (role: AuthIntent | null) => void;
  hydrateRoleHint: () => void;
  hydrateBuyerPhone: () => void;
  setBuyerPhone: (phone: string) => void;
  setCart: (cart: CartLine[] | ((prev: CartLine[]) => CartLine[])) => void;
  setSelectedCartIds: (selection: CartSelection | ((prev: CartSelection) => CartSelection)) => void;
  setWish: (wish: string[] | ((prev: string[]) => string[])) => void;
  setWishSellers: (sellerIds: string[] | ((prev: string[]) => string[])) => void;
  setQuery: (query: string) => void;
  setScreenOverride: (screen: string | null) => void;
  setOrderTotal: (total: number) => void;
  setLastOrderId: (id: string | null) => void;
  setSellerReuploadIntent: (intent: boolean) => void;
  setActiveProduct: (product: Product | null) => void;
  hydrateDelivery: () => void;
  setDeliveryLocation: (location: DeliveryLocation) => void;
  setDeliveryTier: (tier: DeliveryTier) => void;
  hydrateLocale: () => void;
  setLocale: (locale: Locale) => void;
}
