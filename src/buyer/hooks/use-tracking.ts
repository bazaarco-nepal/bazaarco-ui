"use client";

import { useQuery } from "@tanstack/react-query";
import { trackingApi } from "@/buyer/api/tracking";
import { queryKeys } from "@/shared/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useTracking(orderId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tracking(orderId),
    queryFn: () => trackingApi.getByOrderId(orderId),
    enabled: enabled && Boolean(orderId),
    staleTime: STALE_TIME,
  });
}
