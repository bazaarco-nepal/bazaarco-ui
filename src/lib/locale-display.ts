import type { Locale } from "@/i18n";
import ne from "@/i18n/locales/ne.json";
import type { Product } from "@/types";

/** Frontend-only Nepali labels keyed by category id — API always uses `id` / `en`. */
const CATEGORY_NE: Record<string, string> = ne.categories;

export function displayProductName(product: Pick<Product, "name" | "ne">, locale: Locale): string {
  if (locale === "ne") {
    const neName = product.ne?.trim();
    if (neName) return neName;
  }
  return product.name;
}

export function displayCategoryLabel(category: { id: string; en: string }, locale: Locale): string {
  if (locale === "ne") {
    const label = CATEGORY_NE[category.id];
    if (label) return label;
  }
  return category.en;
}
