import { apiClient } from "@/shared/api/http";
import type { ApiSuccessResponse } from "@/shared/api/types";

export interface StorefrontBlock {
  id: string;
  en: string;
  enabled: boolean;
}

import type { StoreAddress } from "@/shared/lib/store-address";

export interface StorefrontData {
  shopName: string;
  slug: string;
  logoUrl: string;
  bannerUrl: string | null;
  about: string;
  blocks: StorefrontBlock[];
  rating: number;
  verified: boolean;
  city?: string;
  storeAddress?: StoreAddress | null;
  tint?: string;
  analytics?: {
    followerCount: number;
    newFollowers7d: number;
    newFollowers30d: number;
  };
}

export interface UpdateStorefrontPayload {
  shopName?: string;
  about?: string;
  blocks?: StorefrontBlock[];
  storeAddress?: StoreAddress;
}

export const storefrontApi = {
  async updateStorefront(payload: UpdateStorefrontPayload): Promise<StorefrontData> {
    const { data } = await apiClient.patch<ApiSuccessResponse<StorefrontData>>(
      "/seller/storefront",
      payload,
    );
    return data.data;
  },

  // The handle is normalized + validated server-side; the response carries the
  // slug that was actually stored, which may differ from what the seller typed.
  async updateHandle(handle: string): Promise<StorefrontData> {
    const { data } = await apiClient.patch<ApiSuccessResponse<StorefrontData>>(
      "/seller/storefront/handle",
      { handle },
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

  async removeLogo(): Promise<StorefrontData> {
    const { data } =
      await apiClient.delete<ApiSuccessResponse<StorefrontData>>("/seller/storefront/logo");
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
