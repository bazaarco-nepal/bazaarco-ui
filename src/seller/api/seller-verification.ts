import { apiClient } from "@/services/api/http";
import type { ApiSuccessResponse } from "@/services/api/types";

export type SellerVerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface SellerVerification {
  status: SellerVerificationStatus;
  docType: string | null;
  docUrl: string | null;
  docIdNumber: string | null;
  ownerName: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  note: string | null;
  canSell: boolean;
}

export interface SubmitSellerVerificationPayload {
  file: File;
  docType: "pan" | "nid";
  docIdNumber?: string;
  ownerName?: string;
}

export const sellerVerificationApi = {
  async submitDocument(payload: SubmitSellerVerificationPayload): Promise<SellerVerification> {
    const form = new FormData();
    form.append("file", payload.file);
    form.append("docType", payload.docType);
    if (payload.docIdNumber) form.append("docIdNumber", payload.docIdNumber);
    if (payload.ownerName) form.append("ownerName", payload.ownerName);
    const { data } = await apiClient.post<ApiSuccessResponse<SellerVerification>>(
      "/seller/verification/document",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },
};
