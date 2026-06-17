import type { DeliveryLocation } from "@/lib/delivery-location";
import { postalForCity } from "@/lib/delivery-location";
import type { SavedAddress } from "@/services/api/addresses";

export const ADDRESS_LABEL_PRESETS = ["Home", "Office", "Other"] as const;

export function savedAddressToDelivery(addr: SavedAddress): DeliveryLocation {
  return {
    city: addr.city,
    area: addr.area,
    landmark: addr.landmark,
    postal: addr.postal?.trim() || postalForCity(addr.city),
    lat: addr.lat ?? undefined,
    lng: addr.lng ?? undefined,
  };
}

export function deliveryToSavePayload(loc: DeliveryLocation, label: string, isDefault?: boolean) {
  return {
    label: label.trim(),
    city: loc.city.trim(),
    area: loc.area.trim(),
    landmark: (loc.landmark ?? "").trim(),
    postal: loc.postal?.trim() || postalForCity(loc.city) || null,
    lat: loc.lat ?? null,
    lng: loc.lng ?? null,
    isDefault,
  };
}

export function formatAddressLine(addr: Pick<SavedAddress, "area" | "city" | "landmark">): string {
  return `${addr.area}, ${addr.city} · ${addr.landmark}`;
}

export function isAddressComplete(loc: {
  city?: string;
  area?: string;
  landmark?: string;
}): boolean {
  return Boolean(loc.city?.trim() && loc.area?.trim() && loc.landmark?.trim());
}
