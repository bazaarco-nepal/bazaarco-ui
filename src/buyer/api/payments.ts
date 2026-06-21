import { postData } from "@/shared/api/http";

export type PaymentVerifyStatus = "captured" | "pending" | "failed" | "cancelled" | "ambiguous";

export interface VerifyEsewaResult {
  status: PaymentVerifyStatus;
  orderId: string;
  paymentId?: string;
  message: string;
}

export const paymentsApi = {
  /**
   * Hand the encoded eSewa callback to the backend, which decodes it, verifies
   * the signature + amount, calls the eSewa status API, and settles the payment.
   * The order is placed only when the backend confirms `captured`.
   */
  verifyEsewa(encodedData: string, source: "success" | "failure"): Promise<VerifyEsewaResult> {
    return postData<VerifyEsewaResult>("/payments/esewa/verify", { encodedData, source });
  },
};
