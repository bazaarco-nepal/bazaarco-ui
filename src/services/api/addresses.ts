import { deleteData, getData, patchData, postData } from "./http";

export interface SavedAddress {
  id: string;
  label: string;
  city: string;
  area: string;
  landmark: string;
  postal: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAddressPayload {
  label: string;
  city: string;
  area: string;
  landmark: string;
  postal?: string | null;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
}

export const addressesApi = {
  list(): Promise<SavedAddress[]> {
    return getData<SavedAddress[]>("/addresses");
  },
  create(payload: SaveAddressPayload): Promise<SavedAddress> {
    return postData<SavedAddress>("/addresses", payload);
  },
  update(id: string, payload: Partial<SaveAddressPayload>): Promise<SavedAddress> {
    return patchData<SavedAddress>(`/addresses/${id}`, payload);
  },
  remove(id: string): Promise<{ deleted: boolean }> {
    return deleteData<{ deleted: boolean }>(`/addresses/${id}`);
  },
  setDefault(id: string): Promise<SavedAddress> {
    return postData<SavedAddress>(`/addresses/${id}/default`, {});
  },
};
