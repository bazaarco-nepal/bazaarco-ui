import { apiClient } from "./http";
import type { ApiSuccessResponse } from "./types";

export interface StorefrontBlock {
  id: string;
  en: string;
  enabled: boolean;
}

export interface StorefrontData {
  shopName: string;
  logoUrl: string;
  bannerUrl: string | null;
  about: string;
  blocks: StorefrontBlock[];
  rating: number;
  verified: boolean;
  city: string;
  tint: string;
}

export interface UpdateStorefrontPayload {
  shopName?: string;
  about?: string;
  blocks?: StorefrontBlock[];
}

export const storefrontApi = {
  async updateStorefront(payload: UpdateStorefrontPayload): Promise<StorefrontData> {
    const { data } = await apiClient.patch<ApiSuccessResponse<StorefrontData>>(
      "/seller/storefront",
      payload,
    );
    return data.data;
  },

  async uploadLogo(file: File): Promise<StorefrontData> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ApiSuccessResponse<StorefrontData>>(
      "/seller/storefront/logo",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  async uploadBanner(file: File): Promise<StorefrontData> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<ApiSuccessResponse<StorefrontData>>(
      "/seller/storefront/banner",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },
};
