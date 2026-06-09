export interface StoreAddress {
  city: string;
  area?: string;
  landmark?: string;
  lat?: number | null;
  lng?: number | null;
}

export function formatStoreAddress(
  address: StoreAddress | null | undefined,
  cityFallback?: string | null,
): string {
  if (address) {
    const parts = [address.landmark, address.area, address.city].filter((part): part is string =>
      Boolean(part?.trim()),
    );
    if (parts.length > 0) return parts.join(", ");
  }
  return cityFallback?.trim() || "";
}

export function emptyStoreAddress(): StoreAddress {
  return { city: "", area: "", landmark: "", lat: null, lng: null };
}
