"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cartApi } from "@/buyer/api/cart";
import { throwOnCriticalError } from "@/shared/api/http";
import { queryKeys } from "@/shared/api/query-keys";
import { useBazaarStore } from "@/store/bazaar-store";
import type { Product } from "@/types/catalog";

function syncCartToStore(items: Awaited<ReturnType<typeof cartApi.get>>["items"]) {
  useBazaarStore.getState().setCart(items);
}

export function useCartQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: async () => {
      const data = await cartApi.get();
      syncCartToStore(data.items);
      return data;
    },
    enabled,
    staleTime: 30_000,
    throwOnError: throwOnCriticalError,
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
  };

  const addItem = useMutation({
    mutationFn: ({
      product,
      qty,
      variantId,
    }: {
      product: Product;
      qty: number;
      variantId?: string | null;
    }) => cartApi.addItem(product.id, qty, variantId),
    onSuccess: (data) => {
      syncCartToStore(data.items);
      void invalidate();
    },
  });

  const updateQty = useMutation({
    mutationFn: ({
      productId,
      qty,
      variantId,
    }: {
      productId: string;
      qty: number;
      variantId?: string | null;
    }) => cartApi.updateItem(productId, qty, variantId),
    // Optimistically reflect the new quantity so the stepper derives its next
    // value from the pending qty — two rapid clicks accumulate (1→2→3) instead
    // of both reading a stale 1 and losing an increment.
    onMutate: ({ productId, qty, variantId }) => {
      const store = useBazaarStore.getState();
      const prevCart = store.cart;
      store.setCart(
        prevCart.map((line) =>
          line.id === productId && (line.variantId ?? null) === (variantId ?? null)
            ? { ...line, qty }
            : line,
        ),
      );
      return { prevCart };
    },
    onError: (_error, _vars, context) => {
      if (context?.prevCart) useBazaarStore.getState().setCart(context.prevCart);
    },
    onSuccess: (data) => {
      syncCartToStore(data.items);
      void invalidate();
    },
  });

  const removeItem = useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId?: string | null }) =>
      cartApi.removeItem(productId, variantId),
    onSuccess: (data) => {
      syncCartToStore(data.items);
      void invalidate();
    },
  });

  const clearCart = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: (data) => {
      syncCartToStore(data.items);
      void invalidate();
    },
  });

  return { addItem, updateQty, removeItem, clearCart };
}
