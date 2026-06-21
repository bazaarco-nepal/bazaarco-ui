import { apiClient, getData } from "@/shared/api/http";
import type { StoreAddress } from "@/shared/lib/store-address";
import type { SellerVerification } from "./seller-verification";
import type { ApiSuccessResponse } from "@/shared/api/types";

export interface SellerStoreSummary {
  sellerId: string;
  shopName: string;
  city: string | null;
  logoUrl: string | null;
  verified: boolean;
}

export interface SellerOrganization {
  linked: boolean;
  sellerId: string | null;
  slug: string | null;
  stores: SellerStoreSummary[];
  shopName: string | null;
  ownerName: string | null;
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
  storeAddress?: StoreAddress;
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

  async createStore(payload: SetupSellerOrganizationPayload): Promise<SellerOrganization> {
    const { data } = await apiClient.post<ApiSuccessResponse<SellerOrganization>>(
      "/seller/stores",
      payload,
    );
    return data.data;
  },

  async switchActiveStore(sellerId: string): Promise<SellerOrganization> {
    const { data } = await apiClient.patch<ApiSuccessResponse<SellerOrganization>>(
      "/seller/stores/active",
      { sellerId },
    );
    return data.data;
  },
};
