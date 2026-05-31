import type { Product } from "@/types";
import { getData } from "./http";

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
  getHome(): Promise<HomeData> {
    return getData<HomeData>("/home");
  },
};
