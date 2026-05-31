import { create } from "zustand";
import type { BazaarStoreState } from "@/types/store";

export const useBazaarStore = create<BazaarStoreState>((set, get) => ({
  authed: false,
  user: null,
  cart: [],
  wish: [],
  query: "",
  orderTotal: 0,
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
  setQuery: (query) => set({ query }),
  setOrderTotal: (orderTotal) => set({ orderTotal }),
  setActiveProduct: (activeProduct) => set({ activeProduct }),
  addToCart: (product, qty = 1) => {
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + qty, price: product.price } : item,
          ),
        };
      }
      return { cart: [...state.cart, { ...product, qty }] };
    });
  },
  toggleWish: (id) => {
    const { wish } = get();
    set({
      wish: wish.includes(id) ? wish.filter((item) => item !== id) : [...wish, id],
    });
  },
}));
