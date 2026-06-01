import { apiClient } from "./http";
import type { SellerVerification } from "./seller-verification";
import type { ApiSuccessResponse } from "./types";

export interface PendingSellerVerification {
  sellerId: string;
  shopName: string;
  userId: string;
  userEmail: string;
  verification: SellerVerification;
}

export const adminApi = {
  async listPendingVerifications(): Promise<PendingSellerVerification[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<PendingSellerVerification[]>>(
      "/admin/seller-verifications",
    );
    return data.data;
  },

  async reviewVerification(
    sellerId: string,
    action: "approve" | "reject",
    note?: string,
  ): Promise<SellerVerification> {
    const { data } = await apiClient.patch<ApiSuccessResponse<SellerVerification>>(
      `/admin/seller-verifications/${sellerId}`,
      { action, note },
    );
    return data.data;
  },
};
