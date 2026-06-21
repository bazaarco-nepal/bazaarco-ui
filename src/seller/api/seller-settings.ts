import { apiClient, getData } from "@/shared/api/http";
import type { ApiSuccessResponse } from "@/shared/api/types";

export interface ShopRules {
  openTime: string;
  closeTime: string;
  returnDays: number;
  returnNotes: string;
  shippingZones: string[];
  holidayMode: boolean;
}

export interface SellerSettings {
  shopRules: ShopRules;
  alertMatrix: boolean[][];
}

export type UpdateSellerSettingsPayload = {
  shopRules?: Partial<ShopRules>;
  alertMatrix?: boolean[][];
};

export const sellerSettingsApi = {
  getSettings(): Promise<SellerSettings> {
    return getData<SellerSettings>("/seller/settings");
  },

  getShippingZones(): Promise<string[]> {
    return getData<string[]>("/seller/settings/shipping-zones");
  },

  async updateSettings(payload: UpdateSellerSettingsPayload): Promise<SellerSettings> {
    const { data } = await apiClient.patch<ApiSuccessResponse<SellerSettings>>(
      "/seller/settings",
      payload,
    );
    return data.data;
  },
};
