"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bargainsApi, type CreateBargainOfferPayload } from "@/shared/api/bargains";
import { queryKeys } from "@/shared/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useBargains() {
  return useQuery({
    queryKey: queryKeys.bargains,
    queryFn: () => bargainsApi.list(),
    staleTime: STALE_TIME,
  });
}

/** Live count of other buyers bargaining on a product — drives the hot-item badge.
 *  Enabled only when a productId is given so the PDP can gate it on bargaining. */
export function useBargainActivity(productId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.bargains, "activity", productId],
    queryFn: () => bargainsApi.activity(productId as string),
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export function useCreateBargainOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBargainOfferPayload) => bargainsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bargains });
    },
  });
}

export function useAcceptBargainOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bargainsApi.accept(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bargains });
      await queryClient.invalidateQueries({ queryKey: queryKeys.seller.bargains });
    },
  });
}

export function useAcceptCounterOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bargainsApi.acceptCounter(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bargains });
    },
  });
}

export function useRejectBargainOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bargainsApi.reject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bargains });
      await queryClient.invalidateQueries({ queryKey: queryKeys.seller.bargains });
    },
  });
}

export function useCounterBargainOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, counter }: { id: string; counter: number }) =>
      bargainsApi.counter(id, counter),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bargains });
      await queryClient.invalidateQueries({ queryKey: queryKeys.seller.bargains });
    },
  });
}
