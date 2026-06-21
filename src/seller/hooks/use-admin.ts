"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/seller/api/admin";

export function usePendingSellerVerifications(enabled = true) {
  return useQuery({
    queryKey: ["admin", "seller-verifications"],
    queryFn: () => adminApi.listPendingVerifications(),
    enabled,
    retry: false,
  });
}

export function useReviewSellerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sellerId,
      action,
      note,
    }: {
      sellerId: string;
      action: "approve" | "reject";
      note?: string;
    }) => adminApi.reviewVerification(sellerId, action, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "seller-verifications"] });
      void qc.invalidateQueries({ queryKey: ["seller", "organization"] });
    },
  });
}
