"use client";

import { useQuery } from "@tanstack/react-query";
import { bargainsApi } from "@/services/api/bargains";
import { queryKeys } from "@/services/api/query-keys";

const STALE_TIME = 60 * 1000;

export function useBargains() {
  return useQuery({
    queryKey: queryKeys.bargains,
    queryFn: () => bargainsApi.list(),
    staleTime: STALE_TIME,
  });
}
