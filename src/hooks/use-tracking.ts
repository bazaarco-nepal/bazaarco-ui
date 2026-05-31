"use client";

import { useQuery } from "@tanstack/react-query";
import { trackingApi } from "@/services/api/tracking";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useTracking(orderId: string) {
  return useQuery({
    queryKey: queryKeys.tracking(orderId),
    queryFn: () => trackingApi.getByOrderId(orderId),
    staleTime: STALE_TIME,
  });
}
