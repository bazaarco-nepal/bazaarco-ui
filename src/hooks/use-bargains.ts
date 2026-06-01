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
