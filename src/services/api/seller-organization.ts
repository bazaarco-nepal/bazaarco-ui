import { apiClient, getData } from "./http";
import type { SellerVerification } from "./seller-verification";
import type { ApiSuccessResponse } from "./types";

export interface SellerOrganization {
  linked: boolean;
  sellerId: string | null;
  shopName: string | null;
  city: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  verified: boolean;
  rating: number;
  verification: SellerVerification;
}

export interface SetupSellerOrganizationPayload {
  shopName: string;
  city?: string;
}

export const sellerOrganizationApi = {
  getOrganization(): Promise<SellerOrganization> {
    return getData<SellerOrganization>("/seller/organization");
  },

  async setupOrganization(payload: SetupSellerOrganizationPayload): Promise<SellerOrganization> {
    const { data } = await apiClient.post<ApiSuccessResponse<SellerOrganization>>(
      "/seller/organization",
      payload,
    );
    return data.data;
  },
};
