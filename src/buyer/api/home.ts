import type { Category, Product, Seller } from "@/types";
import { getData } from "@/shared/api/http";
import { mapProduct, mapSeller } from "@/shared/api/catalog";
import type { PaginatedData } from "@/shared/api/types";

export interface PopularStore extends Seller {
  productCount: number;
  productImages: string[];
  bannerUrl?: string | null;
  verified?: boolean;
}

export interface TrustItem {
  icon: string;
  t: string;
  s: string;
}

export interface HomeData {
  trendingProductIds: string[];
  trending: Product[];
  trustItems: TrustItem[];
  categories: Category[];
  newArrivals: PaginatedData<Product>;
  topPicks: PaginatedData<Product>;
  explore: PaginatedData<Product>;
  popularStores: PopularStore[];
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
      trending: (raw.trending ?? []).map(mapProduct),
      categories: raw.categories ?? [],
      newArrivals: mapProductPage(
        raw.newArrivals ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      ),
      topPicks: mapProductPage(
        raw.topPicks ?? { items: [], total: 0, page: 1, limit: 12, totalPages: 0 },
      ),
      explore: mapProductPage(
        raw.explore ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      ),
      popularStores: (raw.popularStores ?? []).map((store: unknown) => ({
        ...mapSeller(store),
        productCount:
          typeof (store as { productCount?: unknown }).productCount === "number"
            ? (store as { productCount: number }).productCount
            : Number((store as { productCount?: unknown }).productCount ?? 0),
        productImages: Array.isArray((store as { productImages?: unknown }).productImages)
          ? ((store as { productImages: string[] }).productImages ?? []).filter(
              (image): image is string => typeof image === "string" && image.trim().length > 0,
            )
          : [],
        bannerUrl: (store as { bannerUrl?: string | null }).bannerUrl ?? null,
        verified: (store as { verified?: boolean }).verified ?? false,
      })),
    };
  },
};
