import type { Category, Product } from "@/types";
import { getData } from "./http";
import { mapProduct } from "./catalog";
import type { PaginatedData } from "./types";

// Buyer-facing projection of an admin-managed hero banner (see bazaarco-api
// home.service `toBuyerHeroSlide`). Content-only — no lifecycle/audit fields.
export interface HeroSlide {
  id: string;
  title: string;
  accent: string | null;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  tint: "red" | "blue" | "saffron" | string;
  sponsored: boolean;
  campaignLabel: string | null;
}

export interface TrustItem {
  icon: string;
  t: string;
  s: string;
}

export interface HomeData {
  heroSlides: HeroSlide[];
  trendingProductIds: string[];
  trending: Product[];
  trustItems: TrustItem[];
  categories: Category[];
  newArrivals: PaginatedData<Product>;
  topPicks: PaginatedData<Product>;
  explore: PaginatedData<Product>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProductPage(raw: PaginatedData<any>): PaginatedData<Product> {
  return {
    ...raw,
    items: (raw.items ?? []).map(mapProduct),
  };
}

export const homeApi = {
  async getHome(): Promise<HomeData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await getData<any>("/home");
    return {
      ...raw,
      heroSlides: raw.heroSlides ?? [],
      trending: (raw.trending ?? []).map(mapProduct),
      categories: raw.categories ?? [],
      newArrivals: mapProductPage(
        raw.newArrivals ?? { items: [], total: 0, page: 1, limit: 12, totalPages: 0 },
      ),
      topPicks: mapProductPage(
        raw.topPicks ?? { items: [], total: 0, page: 1, limit: 12, totalPages: 0 },
      ),
      explore: mapProductPage(
        raw.explore ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      ),
    };
  },
};
