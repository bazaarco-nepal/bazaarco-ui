"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bargainsApi, type CreateBargainOfferPayload } from "@/services/api/bargains";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useBargains() {
  return useQuery({
    queryKey: queryKeys.bargains,
    queryFn: () => bargainsApi.list(),
    staleTime: STALE_TIME,
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
