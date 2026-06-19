"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "@/services/api/payments";
import { queryKeys } from "@/services/api/query-keys";

/**
 * Verify an eSewa callback server-side. On a captured payment the order has been
 * placed, so the cart and order lists are refreshed. The callback pages call
 * `mutateAsync` and branch on the returned status.
 */
export function useVerifyEsewaPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ encodedData, source }: { encodedData: string; source: "success" | "failure" }) =>
      paymentsApi.verifyEsewa(encodedData, source),
    onSuccess: (result) => {
      if (result.status === "captured") {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list });
      }
    },
  });
}
