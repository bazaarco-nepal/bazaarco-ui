"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/services/api/orders";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.list,
    queryFn: () => ordersApi.list(),
    staleTime: STALE_TIME,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => ordersApi.getById(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracking(order.id) });
    },
  });
}
