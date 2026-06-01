export interface DeliveryLocation {
  city: string;
  area: string;
  postal: string;
  landmark?: string;
  /** Optional map pin from “Drop a pin on the map”. */
  lat?: number;
  lng?: number;
}

export const DEFAULT_DELIVERY: DeliveryLocation = {
  city: "Kathmandu",
  area: "Chabahil",
  postal: "44600",
};

const STORAGE_KEY = "bz_delivery_v1";

/** Common postal codes for major cities (Nepal). */
export const CITY_POSTAL: Record<string, string> = {
  Kathmandu: "44600",
  Lalitpur: "44700",
  Bhaktapur: "44800",
  Pokhara: "33700",
  Biratnagar: "56613",
  Butwal: "32907",
  Dharan: "56700",
  Nepalgunj: "21900",
};

export function postalForCity(city: string): string {
  return CITY_POSTAL[city] ?? "";
}

export function formatDeliverToLabel(loc: DeliveryLocation): string {
  const city = loc.city?.trim();
  const postal = loc.postal?.trim();
  if (city && postal) return `${city} ${postal}`;
  if (city && loc.area) return `${loc.area}, ${city}`;
  if (city) return city;
  return "Set location";
}

export function readDeliveryFromStorage(): DeliveryLocation {
  if (typeof window === "undefined") return DEFAULT_DELIVERY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DELIVERY;
    const parsed = JSON.parse(raw) as Partial<DeliveryLocation>;
    return {
      ...DEFAULT_DELIVERY,
      ...parsed,
      postal: parsed.postal || postalForCity(parsed.city ?? "") || DEFAULT_DELIVERY.postal,
    };
  } catch {
    return DEFAULT_DELIVERY;
  }
}

export function writeDeliveryToStorage(loc: DeliveryLocation): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    /* ignore quota / private mode */
  }
}
