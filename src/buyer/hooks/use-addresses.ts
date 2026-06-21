"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressesApi, type SaveAddressPayload, type SavedAddress } from "@/buyer/api/addresses";
import { queryKeys } from "@/shared/api/query-keys";

const STALE_TIME = 2 * 60 * 1000;

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: () => addressesApi.list(),
    staleTime: STALE_TIME,
    enabled,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveAddressPayload) => addressesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SaveAddressPayload> }) =>
      addressesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressesApi.setDefault(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function pickDefaultAddress(addresses: SavedAddress[] | undefined): SavedAddress | null {
  if (!addresses?.length) return null;
  return addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
}
