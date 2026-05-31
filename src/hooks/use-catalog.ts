"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/api/catalog";

export function useCatalogProducts() {
  return useQuery({
    queryKey: ["catalog", "products"],
    queryFn: () => catalogService.list(),
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["catalog", "product", id],
    queryFn: () => (id ? catalogService.byId(id) : undefined),
    enabled: Boolean(id),
  });
}
