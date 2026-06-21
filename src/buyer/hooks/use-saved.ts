"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedApi } from "@/buyer/api/saved";
import { queryKeys } from "@/shared/api/query-keys";
import { useBazaarStore } from "@/store/bazaar-store";

function syncSavedToStore(data: Awaited<ReturnType<typeof savedApi.get>>) {
  useBazaarStore.getState().setSavedProducts(data.productIds);
  useBazaarStore.getState().setSavedSellers(data.sellerIds);
}

export function useSavedQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.saved.all,
    queryFn: async () => {
      const data = await savedApi.get();
      syncSavedToStore(data);
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useSavedMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.saved.all });
  };

  const addProduct = useMutation({
    mutationFn: (productId: string) => savedApi.addProduct(productId),
    onSuccess: (data) => {
      syncSavedToStore(data);
      void invalidate();
    },
  });

  const removeProduct = useMutation({
    mutationFn: (productId: string) => savedApi.removeProduct(productId),
    onSuccess: (data) => {
      syncSavedToStore(data);
      void invalidate();
    },
  });

  const addSeller = useMutation({
    mutationFn: (sellerId: string) => savedApi.addSeller(sellerId),
    onSuccess: (data) => {
      syncSavedToStore(data);
      void invalidate();
    },
  });

  const removeSeller = useMutation({
    mutationFn: (sellerId: string) => savedApi.removeSeller(sellerId),
    onSuccess: (data) => {
      syncSavedToStore(data);
      void invalidate();
    },
  });

  return { addProduct, removeProduct, addSeller, removeSeller };
}
