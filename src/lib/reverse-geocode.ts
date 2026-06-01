import { NEPAL_CITY_CENTER } from "@/lib/nepal-map-centers";

const KNOWN_CITIES = Object.keys(NEPAL_CITY_CENTER);

function matchKnownCity(parts: Array<string | undefined>): string {
  const blob = parts.filter(Boolean).join(" ").toLowerCase();
  for (const city of KNOWN_CITIES) {
    if (blob.includes(city.toLowerCase())) return city;
  }
  return "";
}

export interface ReverseGeocodeResult {
  city: string;
  area: string;
  landmark: string;
}

/** Best-effort address fields from coordinates (OpenStreetMap Nominatim). */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "BazaarCo/1.0 (delivery-location)",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const addr = data.address ?? {};

    const city = matchKnownCity([
      addr.city,
      addr.town,
      addr.municipality,
      addr.county,
      addr.state,
      addr["ISO3166-2-lvl4"],
      data.display_name,
    ]);

    const area =
      addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.city_district || "";

    const landmark = [addr.road, addr.house_number, addr.residential].filter(Boolean).join(", ");

    return {
      city,
      area,
      landmark: landmark || "",
    };
  } catch {
    return null;
  }
}
