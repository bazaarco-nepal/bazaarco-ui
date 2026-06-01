"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BazaarCtx, LoginPromptModal } from "@/components/common";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCartMutations, useCartQuery } from "@/hooks/use-cart";
import { useWishlistMutations, useWishlistQuery } from "@/hooks/use-wishlist";
import { useProduct } from "@/hooks/use-catalog";
import {
  pathFromScreen,
  productIdFromPath,
  screenFromPath,
  searchQueryFromPath,
} from "@/config/routes";
import { ordersApi } from "@/services/api/orders";
import { ApiRequestError } from "@/services/api/http";
import { useBazaarStore } from "@/store/bazaar-store";
import type { CheckoutPayload } from "@/services/api/orders";
import type { Product } from "@/types";

interface ToastState {
  msg: string;
  id: number;
}

export function BazaarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMsg, setToastMsg] = useState<ToastState | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

  useCurrentUser(true);

  const pathnameSearch = searchQueryFromPath(pathname);
  const setQuery = useBazaarStore((s) => s.setQuery);
  useEffect(() => {
    if (screenFromPath(pathname) === "browse" && pathnameSearch) {
      const current = useBazaarStore.getState().query;
      if (pathnameSearch !== current) {
        setQuery(pathnameSearch);
      }
    }
  }, [pathname, pathnameSearch, setQuery]);

  const authed = useBazaarStore((s) => s.authed);
  const setAuthed = useBazaarStore((s) => s.setAuthed);
  const cart = useBazaarStore((s) => s.cart);
  const wish = useBazaarStore((s) => s.wish);
  const wishSellers = useBazaarStore((s) => s.wishSellers);
  const setWish = useBazaarStore((s) => s.setWish);
  const setWishSellers = useBazaarStore((s) => s.setWishSellers);
  const query = useBazaarStore((s) => s.query);
  const activeProduct = useBazaarStore((s) => s.activeProduct);
  const setActiveProduct = useBazaarStore((s) => s.setActiveProduct);
  const setCart = useBazaarStore((s) => s.setCart);
  const setOrderTotal = useBazaarStore((s) => s.setOrderTotal);
  const setLastOrderId = useBazaarStore((s) => s.setLastOrderId);

  const { isLoading: cartLoading, isFetching: cartFetching } = useCartQuery(authed);
  const { addItem, updateQty, removeItem } = useCartMutations();
  useWishlistQuery(authed);
  const {
    addProduct: addWishProduct,
    removeProduct: removeWishProduct,
    addSeller: addWishSeller,
    removeSeller: removeWishSeller,
  } = useWishlistMutations();

  useEffect(() => {
    if (!authed) {
      setCart([]);
      setWish([]);
      setWishSellers([]);
    }
  }, [authed, setCart, setWish, setWishSellers]);

  const scrollTop = useCallback(() => {
    window.scrollTo(0, 0);
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg({ msg, id: Date.now() });
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const promptLogin = useCallback((message = "Please sign in to continue.") => {
    setAuthPrompt(message);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt(null);
  }, []);

  const goToSignIn = useCallback(() => {
    setAuthPrompt(null);
    router.push(pathFromScreen("auth"));
    setTimeout(scrollTop, 0);
  }, [router, scrollTop]);

  const ensureAuthed = useCallback(
    (message: string) => {
      if (useBazaarStore.getState().authed) return true;
      promptLogin(message);
      return false;
    },
    [promptLogin],
  );

  const toggleWish = useCallback(
    async (productId: string) => {
      if (!ensureAuthed("Please sign in to save products to your wishlist.")) return;
      const isSaved = useBazaarStore.getState().wish.includes(productId);
      try {
        if (isSaved) {
          await removeWishProduct.mutateAsync(productId);
          toast("Removed from wishlist");
        } else {
          await addWishProduct.mutateAsync(productId);
          toast("Saved to wishlist");
        }
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not update wishlist";
        toast(msg);
      }
    },
    [addWishProduct, ensureAuthed, removeWishProduct, toast],
  );

  const toggleSellerWish = useCallback(
    async (sellerId: string) => {
      if (!ensureAuthed("Please sign in to save sellers to your wishlist.")) return;
      const isSaved = useBazaarStore.getState().wishSellers.includes(sellerId);
      try {
        if (isSaved) {
          await removeWishSeller.mutateAsync(sellerId);
          toast("Unfollowed seller");
        } else {
          await addWishSeller.mutateAsync(sellerId);
          toast("Seller saved");
        }
      } catch (error) {
        const msg =
          error instanceof ApiRequestError ? error.message : "Could not update saved sellers";
        toast(msg);
      }
    },
    [addWishSeller, ensureAuthed, removeWishSeller, toast],
  );

  const nav = useCallback(
    (nextScreen: string) => {
      const state = useBazaarStore.getState();
      const productId = state.activeProduct?.id;
      const searchQuery = nextScreen === "browse" ? state.query : undefined;
      router.push(pathFromScreen(nextScreen, productId, searchQuery));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop],
  );

  const submitSearch = useCallback(() => {
    const q = useBazaarStore.getState().query.trim();
    router.push(pathFromScreen("browse", undefined, q || undefined));
    setTimeout(scrollTop, 0);
  }, [router, scrollTop]);

  const openProduct = useCallback(
    (product: Product) => {
      setActiveProduct(product);
      router.push(pathFromScreen("pdp", product.id));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setActiveProduct],
  );

  const addToCart = useCallback(
    async (product: Product, qty = 1, successMessage?: string) => {
      if (!ensureAuthed("Please sign in to add items to your cart.")) return;
      try {
        await addItem.mutateAsync({ product, qty });
        const defaultMsg = qty > 1 ? `${qty} added to cart` : "Added to cart";
        toast(successMessage ?? defaultMsg);
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not add to cart";
        toast(msg);
        throw error;
      }
    },
    [addItem, ensureAuthed, toast],
  );

  const updateCartQty = useCallback(
    async (productId: string, qty: number) => {
      if (!useBazaarStore.getState().authed) return;
      try {
        if (qty < 1) {
          await removeItem.mutateAsync(productId);
          return;
        }
        await updateQty.mutateAsync({ productId, qty });
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not update cart";
        toast(msg);
      }
    },
    [removeItem, updateQty, toast],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (!useBazaarStore.getState().authed) return;
      try {
        await removeItem.mutateAsync(productId);
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not remove item";
        toast(msg);
      }
    },
    [removeItem, toast],
  );

  const buyNow = useCallback(
    async (product: Product, qty = 1) => {
      if (!ensureAuthed("Please sign in to buy now and checkout.")) return;
      try {
        await addItem.mutateAsync({ product, qty });
        nav("checkout");
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not add to cart";
        toast(msg);
      }
    },
    [addItem, ensureAuthed, nav, toast],
  );

  const placeOrder = useCallback(
    async (payload: CheckoutPayload) => {
      if (!ensureAuthed("Please sign in to place your order.")) return;
      try {
        const order = await ordersApi.checkout(payload);
        setOrderTotal(order.total);
        setLastOrderId(order.id);
        setCart([]);
        nav("success");
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not place order";
        toast(msg);
        throw error;
      }
    },
    [ensureAuthed, nav, setCart, setLastOrderId, setOrderTotal, toast],
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const routeProductId = productIdFromPath(pathname);
  const { data: routeProduct } = useProduct(routeProductId);

  const productFromRoute = useMemo(() => {
    if (!routeProductId) {
      return activeProduct;
    }
    return routeProduct ?? activeProduct;
  }, [routeProductId, activeProduct, routeProduct]);

  const value = useMemo(
    () => ({
      screen,
      nav,
      openProduct,
      cart,
      cartLoading: cartLoading || cartFetching,
      addToCart,
      updateCartQty,
      removeFromCart,
      buyNow,
      cartCount,
      wish,
      wishSellers,
      toggleWish,
      toggleSellerWish,
      toast,
      promptLogin,
      query,
      setQuery,
      submitSearch,
      placeOrder,
      authed,
      setAuthed,
      product: productFromRoute,
      toastMsg,
    }),
    [
      screen,
      nav,
      openProduct,
      cart,
      cartLoading,
      cartFetching,
      addToCart,
      updateCartQty,
      removeFromCart,
      buyNow,
      cartCount,
      wish,
      wishSellers,
      toggleWish,
      toggleSellerWish,
      toast,
      promptLogin,
      query,
      setQuery,
      submitSearch,
      placeOrder,
      authed,
      setAuthed,
      productFromRoute,
      toastMsg,
    ],
  );

  return (
    <>
      <BazaarCtx.Provider value={value}>{children}</BazaarCtx.Provider>
      <LoginPromptModal
        open={authPrompt != null}
        message={authPrompt ?? ""}
        onClose={closeAuthPrompt}
        onSignIn={goToSignIn}
      />
    </>
  );
}
