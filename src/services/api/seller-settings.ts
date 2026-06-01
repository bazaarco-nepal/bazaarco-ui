import { apiClient, getData } from "./http";
import type { ApiSuccessResponse } from "./types";

export const SHIPPING_ZONES = [
  "Kathmandu Valley",
  "Pokhara",
  "Biratnagar",
  "Butwal",
  "Dharan",
  "Nepalgunj",
  "Birgunj",
  "Anywhere in Nepal",
] as const;

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
  account: { language: "en" | "ne" | "both" };
}

export type UpdateSellerSettingsPayload = {
  shopRules?: Partial<ShopRules>;
  alertMatrix?: boolean[][];
  account?: { language?: "en" | "ne" | "both" };
};

export const sellerSettingsApi = {
  getSettings(): Promise<SellerSettings> {
    return getData<SellerSettings>("/seller/settings");
  },

  async updateSettings(payload: UpdateSellerSettingsPayload): Promise<SellerSettings> {
    const { data } = await apiClient.patch<ApiSuccessResponse<SellerSettings>>(
      "/seller/settings",
      payload,
    );
    return data.data;
  },
};
