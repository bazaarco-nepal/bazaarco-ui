import { create } from "zustand";
import {
  DEFAULT_LOCALE,
  readLocaleFromStorage,
  writeLocaleToStorage,
  type Locale,
} from "@/i18n/config";
import {
  DEFAULT_DELIVERY,
  readDeliveryFromStorage,
  writeDeliveryToStorage,
} from "@/lib/delivery-location";
import { readRoleHint } from "@/lib/auth-hint";
import { normalizePhone, readPhoneFromStorage, writePhoneToStorage } from "@/lib/buyer-contact";
import type { BazaarStoreState } from "@/types/store";

export const useBazaarStore = create<BazaarStoreState>((set, get) => ({
  authed: false,
  authReady: false,
  user: null,
  roleHint: null,
  cart: [],
  selectedCartIds: null,
  wish: [],
  wishSellers: [],
  query: "",
  screenOverride: null,
  orderTotal: 0,
  lastOrderId: null,
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
  setWish: (wish) =>
    set((state) => ({
      wish: typeof wish === "function" ? wish(state.wish) : wish,
    })),
  setWishSellers: (wishSellers) =>
    set((state) => ({
      wishSellers: typeof wishSellers === "function" ? wishSellers(state.wishSellers) : wishSellers,
    })),
  setQuery: (query) => set({ query }),
  setScreenOverride: (screenOverride) => set({ screenOverride }),
  setOrderTotal: (orderTotal) => set({ orderTotal }),
  setLastOrderId: (lastOrderId) => set({ lastOrderId }),
  setActiveProduct: (activeProduct) => set({ activeProduct }),
  setDeliveryTier: (deliveryTier) => set({ deliveryTier }),
  hydrateLocale: () => {
    if (get().localeHydrated) return;
    set({ locale: readLocaleFromStorage(), localeHydrated: true });
  },
  setLocale: (locale: Locale) => {
    writeLocaleToStorage(locale);
    set({ locale, localeHydrated: true });
  },
}));
