"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi, type SearchParams } from "@/services/api/search";

export function useSearch(params: SearchParams | null) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: () => searchApi.search(params!),
    enabled: Boolean(params?.query),
    staleTime: 60_000,
  });
}
