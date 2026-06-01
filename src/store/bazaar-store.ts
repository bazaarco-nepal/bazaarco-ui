import { create } from "zustand";
import type { BazaarStoreState } from "@/types/store";

export const useBazaarStore = create<BazaarStoreState>((set, get) => ({
  authed: false,
  user: null,
  cart: [],
  wish: [],
  wishSellers: [],
  query: "",
  orderTotal: 0,
  lastOrderId: null,
  activeProduct: null,
  setAuthed: (authed) => set({ authed }),
  setUser: (user) => set({ user }),
  setCart: (cart) =>
    set((state) => ({
      cart: typeof cart === "function" ? cart(state.cart) : cart,
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
  setOrderTotal: (orderTotal) => set({ orderTotal }),
  setLastOrderId: (lastOrderId) => set({ lastOrderId }),
  setActiveProduct: (activeProduct) => set({ activeProduct }),
}));
