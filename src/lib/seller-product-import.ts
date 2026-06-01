/**
 * Bulk product import CSV schema — matches Backend Product entity.
 * seller_id and id are set by the server, not included in the file.
 */

export type ProductImportColumn = {
  key: string;
  header: string;
  required: boolean;
  example: string;
  hint?: string;
};

export const PRODUCT_IMPORT_COLUMNS: ProductImportColumn[] = [
  {
    key: "name",
    header: "name",
    required: true,
    example: "Bamboo Cutting Board",
    hint: "Product title (English)",
  },
  {
    key: "name_ne",
    header: "name_ne",
    required: true,
    example: "बाँसको चपिङ बोर्ड",
    hint: "Nepali title (ne)",
  },
  {
    key: "category_id",
    header: "category_id",
    required: true,
    example: "home",
    hint: "Category slug — see list below",
  },
  {
    key: "price",
    header: "price",
    required: true,
    example: "740",
    hint: "Selling price in NPR (integer)",
  },
  {
    key: "image_url",
    header: "image_url",
    required: true,
    example: "https://example.com/product.jpg",
    hint: "Main product image URL (img)",
  },
  {
    key: "icon",
    header: "icon",
    required: true,
    example: "home",
    hint: "shirt · home · bowl · book · phone · leaf · palette · tag · sparkles · dumbbell · watch · basket",
  },
  {
    key: "tint",
    header: "tint",
    required: true,
    example: "green",
    hint: "red · blue · saffron · purple · slate · green · gold · teal",
  },
  {
    key: "original_price",
    header: "original_price",
    required: false,
    example: "950",
    hint: "Compare-at / was price (shows discount)",
  },
  {
    key: "low_stock",
    header: "low_stock",
    required: false,
    example: "3",
    hint: "Show “low stock” alert when this many or fewer left",
  },
  {
    key: "eta",
    header: "eta",
    required: false,
    example: "Tue, Jun 2",
    hint: "Delivery estimate shown to buyers",
  },
  {
    key: "tag",
    header: "tag",
    required: false,
    example: "Bestseller",
    hint: "Badge: Bestseller · Flash · Trending · Made in Nepal · Premium",
  },
  {
    key: "has_video",
    header: "has_video",
    required: false,
    example: "false",
    hint: "true or false",
  },
  {
    key: "video_url",
    header: "video_url",
    required: false,
    example: "",
    hint: "MP4 URL if has_video is true",
  },
  {
    key: "video_thumb",
    header: "video_thumb",
    required: false,
    example: "",
    hint: "Video poster image URL",
  },
  {
    key: "rating",
    header: "rating",
    required: false,
    example: "4.6",
    hint: "0–5, one decimal (defaults to 0)",
  },
  {
    key: "reviews",
    header: "reviews",
    required: false,
    example: "142",
    hint: "Review count (defaults to 0)",
  },
];

export const PRODUCT_CATEGORY_IDS = [
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home & Living" },
  { id: "handicraft", label: "Handicrafts" },
  { id: "beauty", label: "Beauty" },
  { id: "electronics", label: "Electronics" },
  { id: "grocery", label: "Groceries" },
  { id: "books", label: "Books" },
  { id: "sports", label: "Sports" },
] as const;

const SAMPLE_ROW: Record<string, string> = {
  name: "Bamboo Cutting Board",
  name_ne: "बाँसको चपिङ बोर्ड",
  category_id: "home",
  price: "740",
  image_url: "https://picsum.photos/seed/cuttingboard/600/600",
  icon: "home",
  tint: "green",
  original_price: "950",
  low_stock: "3",
  eta: "Tue, Jun 2",
  tag: "",
  has_video: "false",
  video_url: "",
  video_thumb: "",
  rating: "4.6",
  reviews: "142",
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildProductImportSampleCsv(): string {
  const headers = PRODUCT_IMPORT_COLUMNS.map((c) => c.header);
  const row = headers.map((h) => escapeCsvCell(SAMPLE_ROW[h] ?? ""));
  return [headers.join(","), row.join(",")].join("\n");
}

export function downloadProductImportSample(): void {
  const csv = buildProductImportSampleCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bazaarco-products-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const PRODUCT_IMPORT_REQUIRED = PRODUCT_IMPORT_COLUMNS.filter((c) => c.required);
export const PRODUCT_IMPORT_OPTIONAL = PRODUCT_IMPORT_COLUMNS.filter((c) => !c.required);
