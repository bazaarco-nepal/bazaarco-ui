"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { wishlistApi } from "@/services/api/wishlist";
import { queryKeys } from "@/services/api/query-keys";
import { useBazaarStore } from "@/store/bazaar-store";

function syncWishlistToStore(data: Awaited<ReturnType<typeof wishlistApi.get>>) {
  useBazaarStore.getState().setWish(data.productIds);
  useBazaarStore.getState().setWishSellers(data.sellerIds);
}

export function useWishlistQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: async () => {
      const data = await wishlistApi.get();
      syncWishlistToStore(data);
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useWishlistMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
  };

  const addProduct = useMutation({
    mutationFn: (productId: string) => wishlistApi.addProduct(productId),
    onSuccess: (data) => {
      syncWishlistToStore(data);
      void invalidate();
    },
  });

  const removeProduct = useMutation({
    mutationFn: (productId: string) => wishlistApi.removeProduct(productId),
    onSuccess: (data) => {
      syncWishlistToStore(data);
      void invalidate();
    },
  });

  const addSeller = useMutation({
    mutationFn: (sellerId: string) => wishlistApi.addSeller(sellerId),
    onSuccess: (data) => {
      syncWishlistToStore(data);
      void invalidate();
    },
  });

  const removeSeller = useMutation({
    mutationFn: (sellerId: string) => wishlistApi.removeSeller(sellerId),
    onSuccess: (data) => {
      syncWishlistToStore(data);
      void invalidate();
    },
  });

  return { addProduct, removeProduct, addSeller, removeSeller };
}
