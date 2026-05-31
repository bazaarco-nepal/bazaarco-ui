"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BazaarCtx } from "@/components/common";
import { byId } from "@/constants/catalog";
import { pathFromScreen, productIdFromPath, screenFromPath } from "@/config/routes";
import { useBazaarStore } from "@/store/bazaar-store";
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

  const authed = useBazaarStore((s) => s.authed);
  const setAuthed = useBazaarStore((s) => s.setAuthed);
  const cart = useBazaarStore((s) => s.cart);
  const setCart = useBazaarStore((s) => s.setCart);
  const wish = useBazaarStore((s) => s.wish);
  const query = useBazaarStore((s) => s.query);
  const setQuery = useBazaarStore((s) => s.setQuery);
  const activeProduct = useBazaarStore((s) => s.activeProduct);
  const setActiveProduct = useBazaarStore((s) => s.setActiveProduct);
  const addToCart = useBazaarStore((s) => s.addToCart);
  const toggleWish = useBazaarStore((s) => s.toggleWish);
  const setOrderTotal = useBazaarStore((s) => s.setOrderTotal);

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

  const nav = useCallback(
    (nextScreen: string) => {
      const productId = useBazaarStore.getState().activeProduct?.id;
      router.push(pathFromScreen(nextScreen, productId));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop],
  );

  const openProduct = useCallback(
    (product: Product) => {
      setActiveProduct(product);
      router.push(pathFromScreen("pdp", product.id));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setActiveProduct],
  );

  const buyNow = useCallback(
    (product: Product, qty = 1) => {
      addToCart(product, qty);
      nav("checkout");
    },
    [addToCart, nav],
  );

  const placeOrder = useCallback(
    (total: number) => {
      setOrderTotal(total);
      setCart([]);
      nav("success");
    },
    [nav, setCart, setOrderTotal],
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const productFromRoute = useMemo(() => {
    const id = productIdFromPath(pathname);
    if (!id) {
      return activeProduct;
    }
    return byId(id) ?? activeProduct;
  }, [pathname, activeProduct]);

  const value = useMemo(
    () => ({
      screen,
      nav,
      openProduct,
      cart,
      setCart,
      addToCart,
      buyNow,
      cartCount,
      wish,
      toggleWish,
      toast,
      query,
      setQuery,
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
      setCart,
      addToCart,
      buyNow,
      cartCount,
      wish,
      toggleWish,
      toast,
      query,
      setQuery,
      placeOrder,
      authed,
      setAuthed,
      productFromRoute,
      toastMsg,
    ],
  );

  return <BazaarCtx.Provider value={value}>{children}</BazaarCtx.Provider>;
}
