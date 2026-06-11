"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BazaarCtx, LoginPromptModal } from "@/components/common";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCartMutations, useCartQuery } from "@/hooks/use-cart";
import { useWishlistMutations, useWishlistQuery } from "@/hooks/use-wishlist";
import { useProduct } from "@/hooks/use-catalog";
import { searchPath, pathFromScreen, productIdFromPath, screenFromPath } from "@/config/routes";
import { ordersApi } from "@/services/api/orders";
import { ApiRequestError } from "@/services/api/http";
import { useBazaarStore } from "@/store/bazaar-store";
import { queryKeys } from "@/services/api/query-keys";
import {
  cartLineKey,
  effectiveSelectedIds,
  pruneSelection,
  selectLine,
} from "@/lib/cart-selection";
import { inferToastVariant, type ToastVariant } from "@/lib/toast-variant";
import type { CheckoutPayload } from "@/services/api/orders";
import type { BazaarToast, Product } from "@/types";

const TOAST_VISIBLE_MS = 3200;

export function BazaarProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMsg, setToastMsg] = useState<BazaarToast | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

  const meQuery = useCurrentUser(true);
  const setAuthReady = useBazaarStore((s) => s.setAuthReady);
  const hydrateRoleHint = useBazaarStore((s) => s.hydrateRoleHint);
  const hydrateBuyerPhone = useBazaarStore((s) => s.hydrateBuyerPhone);

  // Seed the persisted role hint as early as possible so a returning seller is
  // held on a loader (not the buyer homepage) while the /me probe is in flight.
  useEffect(() => {
    hydrateRoleHint();
    hydrateBuyerPhone();
  }, [hydrateRoleHint, hydrateBuyerPhone]);

  useEffect(() => {
    if (meQuery.isFetched) {
      setAuthReady(true);
    }
    // Probe failed — no live session. Drop a stale hint so we don't keep
    // gating a signed-out (e.g. expired) former seller behind a loader.
    if (meQuery.isError) {
      useBazaarStore.getState().setRoleHint(null);
    }
  }, [meQuery.isFetched, meQuery.isError, setAuthReady]);

  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const setQuery = useBazaarStore((s) => s.setQuery);
  useEffect(() => {
    const s = screenFromPath(pathname);
    if (s === "browse" || s === "search") {
      const current = useBazaarStore.getState().query;
      if (!urlQuery) {
        if (current) setQuery("");
      } else if (urlQuery !== current) {
        setQuery(urlQuery);
      }
    }
  }, [pathname, urlQuery, setQuery]);

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
  const setSelectedCartIds = useBazaarStore((s) => s.setSelectedCartIds);
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
      setSelectedCartIds(null);
      setWish([]);
      setWishSellers([]);
    }
  }, [authed, setCart, setSelectedCartIds, setWish, setWishSellers]);

  // Keep the checkout selection valid as the cart changes: drop ids for items
  // that left the cart. The `null` ("all selected") sentinel passes through, so
  // a never-touched cart keeps defaulting to "buy everything".
  useEffect(() => {
    setSelectedCartIds((prev) => pruneSelection(cart, prev));
  }, [cart, setSelectedCartIds]);

  const scrollTop = useCallback(() => {
    window.scrollTo(0, 0);
  }, []);

  const toast = useCallback(
    (msg: string, variant?: ToastVariant, options?: { undo?: () => void }) => {
      setToastMsg({
        msg,
        id: Date.now(),
        variant: variant ?? inferToastVariant(msg),
        undo: options?.undo,
      });
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
      toastTimer.current = setTimeout(() => setToastMsg(null), TOAST_VISIBLE_MS);
    },
    [],
  );

  const promptLogin = useCallback((message = "Please sign in to continue.") => {
    setAuthPrompt(message);
  }, []);

  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt(null);
  }, []);

  const goToSignIn = useCallback(() => {
    setAuthPrompt(null);
    // Remember where the prompt was triggered so we can return here after
    // sign-in. Capture the full location (path + query) so product ids and
    // browse filters survive the round-trip.
    const here =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : pathname;
    const authPath = pathFromScreen("auth");
    const target =
      here && screenFromPath(here) !== "auth"
        ? `${authPath}?next=${encodeURIComponent(here)}`
        : authPath;
    router.push(target);
    setTimeout(scrollTop, 0);
  }, [router, scrollTop, pathname]);

  const ensureAuthed = useCallback(
    (message: string) => {
      if (useBazaarStore.getState().authed) return true;
      promptLogin(message);
      return false;
    },
    [promptLogin],
  );

  // Self-reference so the "Saved to wishlist" toast can offer an Undo that
  // re-runs the toggle (now a remove) without making toggleWish depend on
  // itself in useCallback.
  const toggleWishRef = useRef<(productId: string) => Promise<void>>(async () => {});

  const toggleWish = useCallback(
    async (productId: string) => {
      if (!ensureAuthed("Please sign in to save products to your wishlist.")) return;
      const prev = useBazaarStore.getState().wish;
      const isSaved = prev.includes(productId);
      setWish(isSaved ? prev.filter((id) => id !== productId) : [...prev, productId]);
      if (isSaved) {
        toast("Removed from wishlist");
      } else {
        toast("Saved to wishlist", undefined, {
          undo: () => void toggleWishRef.current(productId),
        });
      }
      try {
        if (isSaved) {
          await removeWishProduct.mutateAsync(productId);
        } else {
          await addWishProduct.mutateAsync(productId);
        }
      } catch {
        setWish(prev);
      }
    },
    [addWishProduct, ensureAuthed, removeWishProduct, setWish, toast],
  );
  toggleWishRef.current = toggleWish;

  const toggleSellerWish = useCallback(
    async (sellerId: string) => {
      if (!ensureAuthed("Please sign in to save sellers to your wishlist.")) return;
      const prev = useBazaarStore.getState().wishSellers;
      const isSaved = prev.includes(sellerId);
      setWishSellers(isSaved ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]);
      toast(isSaved ? "Unfollowed seller" : "Seller saved");
      try {
        if (isSaved) {
          await removeWishSeller.mutateAsync(sellerId);
        } else {
          await addWishSeller.mutateAsync(sellerId);
        }
      } catch {
        setWishSellers(prev);
      }
    },
    [addWishSeller, ensureAuthed, removeWishSeller, setWishSellers, toast],
  );

  const nav = useCallback(
    (nextScreen: string, options?: { cat?: string }) => {
      const state = useBazaarStore.getState();
      const productId = state.activeProduct?.id;
      if (nextScreen === "browse") {
        const cat = options?.cat;
        // Picking a category is a fresh category browse — drop any active text
        // query so results show only that category, ranked by relevance (the
        // default sort, which searchPath omits from the URL).
        if (cat) state.setQuery("");
        const q = cat ? undefined : state.query.trim() || undefined;
        // Browse/category results render on the faceted /search screen, so the
        // optimistic override must be "search". Using "browse" here never
        // matches the /search route, so it would stick and leave the Browse
        // spinner on screen forever.
        state.setScreenOverride("search");
        router.push(searchPath({ q, cat }));
      } else {
        state.setScreenOverride(null);
        router.push(pathFromScreen(nextScreen, productId));
      }
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop],
  );

  const submitSearch = useCallback(() => {
    const q = useBazaarStore.getState().query.trim();
    useBazaarStore.getState().setScreenOverride("search");
    router.push(searchPath({ q: q || undefined }));
    setTimeout(scrollTop, 0);
  }, [router, scrollTop]);

  const clearSearch = useCallback(() => {
    useBazaarStore.getState().setQuery("");
    const s = screenFromPath(pathname);
    if (s === "search" || s === "browse") {
      useBazaarStore.getState().setScreenOverride("search");
      router.push(searchPath());
      setTimeout(scrollTop, 0);
    }
  }, [router, scrollTop, pathname]);

  const openProduct = useCallback(
    (product: Product) => {
      setActiveProduct(product);
      // Optimistic screen — avoids flashing the previous page (e.g. browse)
      // while Next.js updates the URL to /product/:id.
      useBazaarStore.getState().setScreenOverride("pdp");
      router.push(pathFromScreen("pdp", product.id));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setActiveProduct],
  );

  const openStore = useCallback(
    (sellerId: string) => {
      router.push(pathFromScreen("store", sellerId));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop],
  );

  const openTracking = useCallback(
    (orderId: string) => {
      setLastOrderId(orderId);
      router.push(pathFromScreen("tracking", undefined, undefined, orderId));
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setLastOrderId],
  );

  const addToCart = useCallback(
    async (
      product: Product,
      qty = 1,
      successMessage?: string,
      // A single variant, or several at once — a grouped-variant product lets
      // the buyer pick one option from each group and add them together.
      variantId?: string | null | Array<string | null>,
    ) => {
      if (!ensureAuthed("Please sign in to add items to your cart.")) return;
      const variantIds = Array.isArray(variantId) ? variantId : [variantId ?? null];
      try {
        for (const vid of variantIds) {
          await addItem.mutateAsync({ product, qty, variantId: vid });
          // A freshly-added item should be selected for checkout. No-op while the
          // selection is still the "all" sentinel.
          setSelectedCartIds((prev) =>
            selectLine(prev, cartLineKey({ id: product.id, variantId: vid })),
          );
        }
        const defaultMsg =
          variantIds.length > 1
            ? `${variantIds.length} options added to cart`
            : qty > 1
              ? `${qty} added to cart`
              : "Added to cart";
        toast(successMessage ?? defaultMsg);
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not add to cart";
        toast(msg, "error");
        throw error;
      }
    },
    [addItem, ensureAuthed, setSelectedCartIds, toast],
  );

  const updateCartQty = useCallback(
    async (productId: string, qty: number, variantId?: string | null) => {
      if (!useBazaarStore.getState().authed) return;
      try {
        if (qty < 1) {
          await removeItem.mutateAsync({ productId, variantId });
          return;
        }
        await updateQty.mutateAsync({ productId, qty, variantId });
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not update cart";
        toast(msg, "error");
      }
    },
    [removeItem, updateQty, toast],
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!useBazaarStore.getState().authed) return;
      try {
        await removeItem.mutateAsync({ productId, variantId });
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not remove item";
        toast(msg, "error");
      }
    },
    [removeItem, toast],
  );

  const buyNow = useCallback(
    async (product: Product, qty = 1, variantId?: string | null | Array<string | null>) => {
      if (!ensureAuthed("Please sign in to buy now and checkout.")) return;
      const variantIds = Array.isArray(variantId) ? variantId : [variantId ?? null];
      try {
        for (const vid of variantIds) {
          await addItem.mutateAsync({ product, qty, variantId: vid });
        }
        nav("checkout");
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not add to cart";
        toast(msg, "error");
      }
    },
    [addItem, ensureAuthed, nav, toast],
  );

  const placeOrder = useCallback(
    async (payload: CheckoutPayload) => {
      if (!ensureAuthed("Please sign in to place your order.")) return;
      try {
        const { cart: currentCart, selectedCartIds } = useBazaarStore.getState();
        // Resolve the selection to an explicit id list (the server only orders
        // and clears these). The "all" sentinel expands to the whole cart.
        const selectedItemIds = effectiveSelectedIds(currentCart, selectedCartIds);
        const order = await ordersApi.checkout({ ...payload, selectedItemIds });
        setOrderTotal(order.total);
        setLastOrderId(order.id);
        // Remove only the lines actually ordered; leave the rest (incl. other
        // variants of the same product). `selectedItemIds` are composite line
        // keys; the cart query refetch below reconciles with the server.
        const orderedKeys = new Set(selectedItemIds);
        setCart((prev) => prev.filter((line) => !orderedKeys.has(cartLineKey(line))));
        setSelectedCartIds(null);
        // Reconcile with the server (it cleared only the ordered rows).
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        nav("success");
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : "Could not place order";
        toast(msg, "error");
        throw error;
      }
    },
    [
      ensureAuthed,
      nav,
      queryClient,
      setCart,
      setLastOrderId,
      setOrderTotal,
      setSelectedCartIds,
      toast,
    ],
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const routeProductId = productIdFromPath(pathname);
  const { data: routeProduct } = useProduct(routeProductId);

  // Keep activeProduct aligned with the URL. Never fall back to a different
  // product id — that caused another product's description/details on PDP.
  useEffect(() => {
    if (routeProduct) {
      setActiveProduct(routeProduct);
    }
  }, [routeProduct, setActiveProduct]);

  const productFromRoute = useMemo(() => {
    if (!routeProductId) {
      return activeProduct;
    }
    if (routeProduct) {
      return routeProduct;
    }
    if (activeProduct?.id === routeProductId) {
      return activeProduct;
    }
    return null;
  }, [routeProductId, activeProduct, routeProduct]);

  const value = useMemo(
    () => ({
      screen,
      nav,
      openProduct,
      openStore,
      openTracking,
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
      clearSearch,
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
      openStore,
      openTracking,
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
      clearSearch,
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
