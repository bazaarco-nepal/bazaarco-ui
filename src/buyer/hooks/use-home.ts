"use client";

import { useQuery } from "@tanstack/react-query";
import { homeApi } from "@/buyer/api/home";
import { queryKeys } from "@/shared/api/query-keys";

const STALE_TIME = 5 * 60 * 1000;

export function useHome() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: () => homeApi.getHome(),
    staleTime: STALE_TIME,
  });
}
