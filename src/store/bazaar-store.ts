import { create } from "zustand";
import {
  DEFAULT_LOCALE,
  readLocaleFromStorage,
  writeLocaleToStorage,
  writeLocaleToCookie,
  type Locale,
} from "@/i18n/config";
import {
  DEFAULT_DELIVERY,
  readDeliveryFromStorage,
  writeDeliveryToStorage,
} from "@/shared/lib/delivery-location";
import { readRoleHint } from "@/shared/lib/auth-hint";
import {
  normalizePhone,
  readPhoneFromStorage,
  writePhoneToStorage,
} from "@/buyer/lib/buyer-contact";
import type { BazaarStoreState } from "@/types/store";

export const useBazaarStore = create<BazaarStoreState>((set, get) => ({
  authed: false,
  authReady: false,
  user: null,
  roleHint: null,
  cart: [],
  selectedCartIds: null,
  savedProducts: [],
  savedSellers: [],
  query: "",
  screenOverride: null,
  orderTotal: 0,
  lastOrderId: null,
  sellerReuploadIntent: false,
  activeProduct: null,
  deliveryLocation: DEFAULT_DELIVERY,
  deliveryHydrated: false,
  buyerPhone: "",
  buyerPhoneHydrated: false,
  deliveryTier: "standard",
  locale: DEFAULT_LOCALE,
  localeHydrated: false,
  setAuthed: (authed) => set({ authed }),
  setAuthReady: (authReady) => set({ authReady }),
  hydrateDelivery: () => {
    if (get().deliveryHydrated) return;
    set({ deliveryLocation: readDeliveryFromStorage(), deliveryHydrated: true });
  },
  setDeliveryLocation: (deliveryLocation) => {
    writeDeliveryToStorage(deliveryLocation);
    set({ deliveryLocation, deliveryHydrated: true });
  },
  hydrateBuyerPhone: () => {
    if (get().buyerPhoneHydrated) return;
    set({ buyerPhone: readPhoneFromStorage(), buyerPhoneHydrated: true });
  },
  setBuyerPhone: (phone) => {
    const buyerPhone = normalizePhone(phone);
    writePhoneToStorage(buyerPhone);
    set({ buyerPhone, buyerPhoneHydrated: true });
  },
  setUser: (user) => set({ user }),
  setRoleHint: (roleHint) => set({ roleHint }),
  hydrateRoleHint: () => set({ roleHint: readRoleHint() }),
  setCart: (cart) =>
    set((state) => ({
      cart: typeof cart === "function" ? cart(state.cart) : cart,
    })),
  setSelectedCartIds: (selection) =>
    set((state) => ({
      selectedCartIds:
        typeof selection === "function" ? selection(state.selectedCartIds) : selection,
    })),
  setSavedProducts: (savedProducts) =>
    set((state) => ({
      savedProducts:
        typeof savedProducts === "function" ? savedProducts(state.savedProducts) : savedProducts,
    })),
  setSavedSellers: (savedSellers) =>
    set((state) => ({
      savedSellers:
        typeof savedSellers === "function" ? savedSellers(state.savedSellers) : savedSellers,
    })),
  setQuery: (query) => set({ query }),
  setScreenOverride: (screenOverride) => set({ screenOverride }),
  setOrderTotal: (orderTotal) => set({ orderTotal }),
  setLastOrderId: (lastOrderId) => set({ lastOrderId }),
  setSellerReuploadIntent: (sellerReuploadIntent) => set({ sellerReuploadIntent }),
  setActiveProduct: (activeProduct) => set({ activeProduct }),
  setDeliveryTier: (deliveryTier) => set({ deliveryTier }),
  hydrateLocale: () => {
    if (get().localeHydrated) return;
    const locale = readLocaleFromStorage();
    // Also write the cookie so the Next.js server can read it on the NEXT
    // page load and render in the same locale, eliminating the hydration mismatch.
    writeLocaleToCookie(locale);
    set({ locale, localeHydrated: true });
  },
  setLocale: (locale: Locale) => {
    writeLocaleToStorage(locale);
    writeLocaleToCookie(locale);
    set({ locale, localeHydrated: true });
  },
}));
