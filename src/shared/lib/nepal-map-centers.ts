/** Default map centers [lat, lng] for delivery city pickers. */
export const NEPAL_CITY_CENTER: Record<string, [number, number]> = {
  Kathmandu: [27.7172, 85.324],
  Lalitpur: [27.6588, 85.3247],
  Bhaktapur: [27.671, 85.4298],
  Pokhara: [28.2096, 83.9856],
  Biratnagar: [26.4521, 87.2718],
  Butwal: [27.7004, 83.4483],
  Dharan: [26.8065, 87.2846],
  Nepalgunj: [28.0506, 81.616],
};

export const DEFAULT_MAP_CENTER: [number, number] = [27.7172, 85.324];

export function centerForCity(city: string): [number, number] {
  return NEPAL_CITY_CENTER[city] ?? DEFAULT_MAP_CENTER;
}
