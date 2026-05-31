import { PRODUCTS, byId, inCat, videoProducts, flashProducts } from "@/constants/catalog";
import type { Product } from "@/types";

export const catalogService = {
  list(): Product[] {
    return PRODUCTS;
  },
  byId(id: string): Product | undefined {
    return byId(id);
  },
  byCategory(categoryId: string): Product[] {
    return inCat(categoryId);
  },
  withVideo(): Product[] {
    return videoProducts();
  },
  onSale(): Product[] {
    return flashProducts();
  },
};
