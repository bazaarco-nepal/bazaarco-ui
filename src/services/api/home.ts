import type { Product } from "@/types";
import { getData } from "./http";
import { mapProduct } from "./catalog";

export interface HeroSlide {
  eyebrow: string;
  title: string;
  accent: string;
  sub: string;
  icon: string;
  tint: string;
  cta: string;
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
}

export const homeApi = {
  async getHome(): Promise<HomeData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await getData<any>("/home");
    return {
      ...raw,
      trending: (raw.trending ?? []).map(mapProduct),
    };
  },
};
