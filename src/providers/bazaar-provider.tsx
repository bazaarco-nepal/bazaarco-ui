"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BazaarCtx, LoginPromptModal } from "@/components/common";
import { BuyerPack, ToastContainer } from "@/components/ui";
import { useCartMutations, useCartQuery } from "@/buyer/hooks/use-cart";
import { useSavedMutations, useSavedQuery } from "@/buyer/hooks/use-saved";
import { useProduct } from "@/shared/hooks/use-catalog";
import {
  searchPath,
  browsePath,
  pathFromScreen,
  productIdFromPath,
  screenFromPath,
  videoPath,
} from "@/config/routes";
import { ordersApi } from "@/buyer/api/orders";
import { buyerEventsApi } from "@/buyer/api/buyer-events";
import { ApiRequestError } from "@/shared/api/http";
import { useBazaarStore } from "@/store/bazaar-store";
import { queryKeys } from "@/shared/api/query-keys";
import {
  cartLineKey,
  effectiveSelectedIds,
  pruneSelection,
  selectLine,
} from "@/buyer/lib/cart-selection";
import { toast } from "@/shared/lib/toast";
import type { CheckoutPayload, EsewaPaymentInit } from "@/buyer/api/orders";
import type { Product } from "@/types";
import type { ProductOpenSource } from "@/types/bazaar";

function productPath(productId: string, options?: { offer?: boolean; source?: ProductOpenSource }) {
  const path = pathFromScreen("pdp", productId);
  const params = new URLSearchParams();
  if (options?.offer) params.set("offer", "1");
  if (options?.source) {
    params.set("srcPage", options.source.page);
    params.set("srcSection", options.source.section);
    if (options.source.position) params.set("srcPos", String(options.source.position));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function BazaarProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const screen = screenFromPath(pathname);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

  // The live-session probe and role-hint hydration moved up to SessionProvider
  // (src/shared/providers) so both the buyer and seller environments share one
  // probe. This provider keeps only the buyer cart/saved/checkout context.

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
  const savedProducts = useBazaarStore((s) => s.savedProducts);
  const savedSellers = useBazaarStore((s) => s.savedSellers);
  const setSavedProducts = useBazaarStore((s) => s.setSavedProducts);
  const setSavedSellers = useBazaarStore((s) => s.setSavedSellers);
  const query = useBazaarStore((s) => s.query);
  const activeProduct = useBazaarStore((s) => s.activeProduct);
  const setActiveProduct = useBazaarStore((s) => s.setActiveProduct);
  const setActiveStoreId = useBazaarStore((s) => s.setActiveStoreId);
  const setActiveVideoProductId = useBazaarStore((s) => s.setActiveVideoProductId);
  const setCart = useBazaarStore((s) => s.setCart);
  const setSelectedCartIds = useBazaarStore((s) => s.setSelectedCartIds);
  const setOrderTotal = useBazaarStore((s) => s.setOrderTotal);
  const setLastOrderId = useBazaarStore((s) => s.setLastOrderId);

  const { isLoading: cartLoading, isFetching: cartFetching } = useCartQuery(authed);
  const { addItem, updateQty, removeItem } = useCartMutations();
  useSavedQuery(authed);
  const {
    addProduct: addSavedProduct,
    removeProduct: removeSavedProduct,
    addSeller: addSavedSeller,
    removeSeller: removeSavedSeller,
  } = useSavedMutations();

  useEffect(() => {
    if (!authed) {
      setCart([]);
      setSelectedCartIds(null);
      setSavedProducts([]);
      setSavedSellers([]);
    }
  }, [authed, setCart, setSelectedCartIds, setSavedProducts, setSavedSellers]);

  // Keep the checkout selection valid as the cart changes: drop ids for items
  // that left the cart. The `null` ("all selected") sentinel passes through, so
  // a never-touched cart keeps defaulting to "buy everything".
  useEffect(() => {
    setSelectedCartIds((prev) => pruneSelection(cart, prev));
  }, [cart, setSelectedCartIds]);

  // Every navigation below pairs router.push with scrollTop and passes
  // `scroll: false`. The matched route's page renders at the bottom of the DOM
  // (after the shell + footer in PublicLayout), so Next's default
  // scroll-into-view jumps the viewport down once that segment commits — which
  // in prod happens after a server round-trip, beating this scrollTop. Disabling
  // Next's scroll keeps scrollTop authoritative.
  const scrollTop = useCallback(() => {
    window.scrollTo(0, 0);
  }, []);

  const promptLogin = useCallback(
    (message?: string) => {
      setAuthPrompt(message ?? t("toast.signInToContinue"));
    },
    [t],
  );

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
    router.push(target, { scroll: false });
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

  // Self-reference so the "Saved" toast can offer an Undo that re-runs the
  // toggle (now a remove) without making toggleSaved depend on itself in
  // useCallback.
  const toggleSavedRef = useRef<(productId: string) => Promise<void>>(async () => {});

  const toggleSaved = useCallback(
    async (productId: string, productName?: string) => {
      if (!ensureAuthed(t("toast.signInSaveProduct"))) return;
      const prev = useBazaarStore.getState().savedProducts;
      const isSaved = prev.includes(productId);
      setSavedProducts(isSaved ? prev.filter((id) => id !== productId) : [...prev, productId]);
      if (isSaved) {
        toast.success(t("toast.removedFromSaved"));
      } else {
        toast.success(
          productName ? t("toast.saved", { name: productName }) : t("toast.savedGeneric"),
          {
            action: {
              label: t("common.undo"),
              onClick: () => void toggleSavedRef.current(productId),
            },
          },
        );
      }
      try {
        if (isSaved) {
          await removeSavedProduct.mutateAsync(productId);
        } else {
          await addSavedProduct.mutateAsync(productId);
        }
      } catch {
        setSavedProducts(prev);
      }
    },
    [addSavedProduct, ensureAuthed, removeSavedProduct, setSavedProducts, t],
  );
  toggleSavedRef.current = toggleSaved;

  const toggleSavedSeller = useCallback(
    async (sellerId: string) => {
      if (!ensureAuthed(t("toast.signInSaveSeller"))) return;
      const prev = useBazaarStore.getState().savedSellers;
      const isSaved = prev.includes(sellerId);
      setSavedSellers(isSaved ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]);
      toast.success(isSaved ? t("toast.unfollowedSeller") : t("toast.sellerSaved"));
      try {
        if (isSaved) {
          await removeSavedSeller.mutateAsync(sellerId);
        } else {
          await addSavedSeller.mutateAsync(sellerId);
        }
      } catch {
        setSavedSellers(prev);
      }
    },
    [addSavedSeller, ensureAuthed, removeSavedSeller, setSavedSellers, t],
  );

  const nav = useCallback(
    (nextScreen: string, options?: { cat?: string; product?: string }) => {
      const state = useBazaarStore.getState();
      const productId = state.activeProduct?.id;
      if (nextScreen === "browse") {
        const cat = options?.cat;
        if (cat) {
          // Picking a category is a fresh category browse — drop any active text
          // query so results show only that category, ranked by relevance (the
          // default sort, which searchPath omits from the URL).
          state.setQuery("");
          state.setScreenOverride("search");
          router.push(searchPath({ cat }), { scroll: false });
        } else {
          // No category specified — show the all-categories page instead of all
          // products so users can explore categories first.
          state.setScreenOverride(null);
          router.push(browsePath({ view: "categories" }), { scroll: false });
        }
      } else {
        state.setScreenOverride(null);
        const base = pathFromScreen(nextScreen, productId);
        const href = options?.product
          ? `${base}?product=${encodeURIComponent(options.product)}`
          : base;
        router.push(href, { scroll: false });
      }
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop],
  );

  const submitSearch = useCallback(
    (cat?: string) => {
      const q = useBazaarStore.getState().query.trim();
      useBazaarStore.getState().setScreenOverride("search");
      router.push(searchPath({ q: q || undefined, cat: cat || undefined }), { scroll: false });
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop],
  );

  const clearSearch = useCallback(() => {
    useBazaarStore.getState().setQuery("");
    const s = screenFromPath(pathname);
    if (s === "search" || s === "browse") {
      useBazaarStore.getState().setScreenOverride("search");
      router.push(searchPath(), { scroll: false });
      setTimeout(scrollTop, 0);
    }
  }, [router, scrollTop, pathname]);

  const openProduct = useCallback(
    (product: Product, options?: { offer?: boolean; source?: ProductOpenSource }) => {
      setActiveProduct(product);
      // Optimistic screen — avoids flashing the previous page (e.g. browse)
      // while Next.js updates the URL to /product/:id.
      useBazaarStore.getState().setScreenOverride("pdp");
      // `?offer=1` carries the "Make an offer" intent from the bargain rails so the
      // PDP opens the bargain modal on arrival — same path as its own offer button.
      router.push(productPath(product.id, options), { scroll: false });
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setActiveProduct],
  );

  const openStore = useCallback(
    (sellerId: string) => {
      // Optimistic screen + seeded id — the store screen reads its id from the URL,
      // which hasn't committed yet, so seed it to render directly instead of flashing
      // the source page (same pattern as openProduct).
      setActiveStoreId(sellerId);
      useBazaarStore.getState().setScreenOverride("store");
      router.push(pathFromScreen("store", sellerId), { scroll: false });
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setActiveStoreId],
  );

  const openVideo = useCallback(
    (productId?: string) => {
      // Optimistic open of the watch feed; seed the reel id since VideoTheater reads
      // it from the URL query, which hasn't committed yet.
      setActiveVideoProductId(productId ?? null);
      useBazaarStore.getState().setScreenOverride("video");
      router.push(videoPath(productId), { scroll: false });
      setTimeout(scrollTop, 0);
    },
    [router, scrollTop, setActiveVideoProductId],
  );

  const openTracking = useCallback(
    (orderId: string) => {
      setLastOrderId(orderId);
      router.push(pathFromScreen("tracking", undefined, undefined, orderId), { scroll: false });
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
      if (!ensureAuthed(t("toast.signInAddToCart"))) return;
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
            ? t("toast.optionsAddedToCart", { count: variantIds.length })
            : qty > 1
              ? t("toast.qtyAddedToCart", { count: qty })
              : t("toast.addedToCart");
        toast.success(successMessage ?? defaultMsg);
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : t("toast.couldNotAddToCart");
        toast.error(msg);
        throw error;
      }
    },
    [addItem, ensureAuthed, setSelectedCartIds, t],
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
        const msg =
          error instanceof ApiRequestError ? error.message : t("toast.couldNotUpdateCart");
        toast.error(msg);
      }
    },
    [removeItem, updateQty, t],
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!useBazaarStore.getState().authed) return;
      try {
        await removeItem.mutateAsync({ productId, variantId });
      } catch (error) {
        const msg =
          error instanceof ApiRequestError ? error.message : t("toast.couldNotRemoveItem");
        toast.error(msg);
        throw error;
      }
    },
    [removeItem, t],
  );

  const buyNow = useCallback(
    async (product: Product, qty = 1, variantId?: string | null | Array<string | null>) => {
      if (!ensureAuthed(t("toast.signInBuyNow"))) return;
      const variantIds = Array.isArray(variantId) ? variantId : [variantId ?? null];
      try {
        for (const vid of variantIds) {
          await addItem.mutateAsync({ product, qty, variantId: vid });
        }
        // Buy Now checks out exactly the chosen line(s): overwrite any prior
        // (possibly partial) selection so unrelated cart items aren't priced or
        // ordered too. An explicit list also keeps the place-order button enabled.
        setSelectedCartIds(
          variantIds.map((vid) => cartLineKey({ id: product.id, variantId: vid })),
        );
        void buyerEventsApi.record({
          eventType: "checkout_started",
          productId: product.id,
          variantId: variantIds.length === 1 ? variantIds[0] : null,
          storeId: product.seller,
          categoryId: product.cat,
          quantity: qty,
          price: product.price,
          sourcePage: "product_detail",
          sourceSection: "buy_now",
          metadata: {
            checkout_source: "buy_now",
            variant_ids: variantIds.filter((id): id is string => Boolean(id)),
          },
        });
        nav("checkout");
      } catch (error) {
        const msg = error instanceof ApiRequestError ? error.message : t("toast.couldNotAddToCart");
        toast.error(msg);
      }
    },
    [addItem, ensureAuthed, nav, setSelectedCartIds, t],
  );

  const placeOrder = useCallback(
    async (payload: CheckoutPayload) => {
      if (!ensureAuthed(t("toast.signInPlaceOrder"))) return;
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
        const msg =
          error instanceof ApiRequestError ? error.message : t("toast.couldNotPlaceOrder");
        toast.error(msg);
        throw error;
      }
    },
    [ensureAuthed, nav, queryClient, setCart, setLastOrderId, setOrderTotal, setSelectedCartIds, t],
  );

  // eSewa checkout: creates an awaiting_payment order and returns the signed
  // gateway form data. Mirrors placeOrder's cart cleanup but does NOT navigate —
  // the caller submits the returned form to redirect the buyer to eSewa. The
  // order is placed only after the payment is verified server-side on return.
  const checkoutEsewa = useCallback(
    async (payload: CheckoutPayload): Promise<EsewaPaymentInit | null> => {
      if (!ensureAuthed(t("toast.signInPlaceOrder"))) return null;
      try {
        const { cart: currentCart, selectedCartIds } = useBazaarStore.getState();
        const selectedItemIds = effectiveSelectedIds(currentCart, selectedCartIds);
        const { order, payment } = await ordersApi.checkoutEsewa({ ...payload, selectedItemIds });
        setOrderTotal(order.total);
        setLastOrderId(order.id);
        const orderedKeys = new Set(selectedItemIds);
        setCart((prev) => prev.filter((line) => !orderedKeys.has(cartLineKey(line))));
        setSelectedCartIds(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        return payment;
      } catch (error) {
        const msg =
          error instanceof ApiRequestError ? error.message : t("toast.couldNotStartPayment");
        toast.error(msg);
        throw error;
      }
    },
    [ensureAuthed, queryClient, setCart, setLastOrderId, setOrderTotal, setSelectedCartIds, t],
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
      openVideo,
      openTracking,
      cart,
      cartLoading: cartLoading || cartFetching,
      addToCart,
      updateCartQty,
      removeFromCart,
      buyNow,
      cartCount,
      savedProducts,
      savedSellers,
      toggleSaved,
      toggleSavedSeller,
      promptLogin,
      query,
      setQuery,
      submitSearch,
      clearSearch,
      placeOrder,
      checkoutEsewa,
      authed,
      setAuthed,
      product: productFromRoute,
    }),
    [
      screen,
      nav,
      openProduct,
      openStore,
      openVideo,
      openTracking,
      cart,
      cartLoading,
      cartFetching,
      addToCart,
      updateCartQty,
      removeFromCart,
      buyNow,
      cartCount,
      savedProducts,
      savedSellers,
      toggleSaved,
      toggleSavedSeller,
      promptLogin,
      query,
      setQuery,
      submitSearch,
      clearSearch,
      placeOrder,
      checkoutEsewa,
      authed,
      setAuthed,
      productFromRoute,
    ],
  );

  return (
    <>
      <BazaarCtx.Provider value={value}>{children}</BazaarCtx.Provider>
      {/* Guest sign-in prompt is buyer chrome but renders outside the shell, so
          opt it into the buyer button pack explicitly. */}
      <BuyerPack>
        <LoginPromptModal
          open={authPrompt != null}
          message={authPrompt ?? ""}
          onClose={closeAuthPrompt}
          onSignIn={goToSignIn}
        />
      </BuyerPack>
      {/* One toast outlet for the whole app — buyer and seller surfaces alike.
          Mounted outside the buyer pack so it stays theme-neutral everywhere. */}
      <ToastContainer />
    </>
  );
}
