import type { Locale } from "@/i18n";
import type { Product } from "@/types";

export function displayProductName(product: Pick<Product, "name" | "ne">, locale: Locale): string {
  if (locale === "ne") {
    const ne = product.ne?.trim();
    if (ne) return ne;
  }
  return product.name;
}

export function displayCategoryLabel(
  category: { id: string; en: string },
  locale: Locale,
  categoryNe?: Record<string, string>,
): string {
  if (locale === "ne" && categoryNe?.[category.id]) {
    return categoryNe[category.id];
  }
  return category.en;
}
