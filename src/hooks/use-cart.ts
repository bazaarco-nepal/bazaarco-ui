"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cartApi } from "@/services/api/cart";
import { queryKeys } from "@/services/api/query-keys";
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
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
  };

  const addItem = useMutation({
    mutationFn: ({ product, qty }: { product: Product; qty: number }) =>
      cartApi.addItem(product.id, qty),
    onSuccess: (data) => {
      syncCartToStore(data.items);
      void invalidate();
    },
  });

  const updateQty = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      cartApi.updateItem(productId, qty),
    onSuccess: (data) => {
      syncCartToStore(data.items);
      void invalidate();
    },
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => cartApi.removeItem(productId),
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
