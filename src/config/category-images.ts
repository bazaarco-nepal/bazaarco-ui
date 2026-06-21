// Single source of truth for BazaarCo's curated category-tile imagery.
//
// Each category's hero picture is a fixed brand asset (never a seller upload),
// stored at public/images/categories/<slug>.png. To swap a category's image,
// drop a new file at that path or change its one `imageSrc` line below — nothing
// else needs to move.
//
// `slug` matches the catalog category id (see CATEGORY_ICON in
// components/common/marketplace.tsx and the backend taxonomy seed in
// bazaarco-api/src/infrastructure/database/seeds/catalog-data.ts). `label` is the
// canonical English name, used as documentation and image alt text — the visible
// tile label still comes from the localized catalog so buyer views never drift
// from the backend.

export type CategoryImage = {
  slug: string;
  label: string;
  imageSrc: string;
};

const file = (slug: string): string => `/images/categories/${slug}.png`;

export const CATEGORY_IMAGES: CategoryImage[] = [
  {
    slug: "mobile-phones-tablets",
    label: "Mobile Phones & Tablets",
    imageSrc: file("mobile-phones-tablets"),
  },
  {
    slug: "electronics-gadgets",
    label: "Electronics & Gadgets",
    imageSrc: file("electronics-gadgets"),
  },
  {
    slug: "computers-accessories",
    label: "Computers & Accessories",
    imageSrc: file("computers-accessories"),
  },
  { slug: "fashion-clothing", label: "Fashion & Clothing", imageSrc: file("fashion-clothing") },
  { slug: "shoes-footwear", label: "Shoes & Footwear", imageSrc: file("shoes-footwear") },
  {
    slug: "bags-watches-accessories",
    label: "Bags, Watches & Accessories",
    imageSrc: file("bags-watches-accessories"),
  },
  { slug: "beauty-cosmetics", label: "Beauty & Cosmetics", imageSrc: file("beauty-cosmetics") },
  { slug: "health-wellness", label: "Health & Wellness", imageSrc: file("health-wellness") },
  {
    slug: "groceries-essentials",
    label: "Groceries & Daily Essentials",
    imageSrc: file("groceries-essentials"),
  },
  {
    slug: "kitchenware-dining",
    label: "Kitchenware & Dining",
    imageSrc: file("kitchenware-dining"),
  },
  { slug: "home-appliances", label: "Home Appliances", imageSrc: file("home-appliances") },
  { slug: "home-decor", label: "Home Decor", imageSrc: file("home-decor") },
  { slug: "furniture", label: "Furniture", imageSrc: file("furniture") },
  { slug: "baby-kids-toys", label: "Baby, Kids & Toys", imageSrc: file("baby-kids-toys") },
  {
    slug: "sports-fitness-outdoors",
    label: "Sports, Fitness & Outdoors",
    imageSrc: file("sports-fitness-outdoors"),
  },
  {
    slug: "automotive-motorbike",
    label: "Automotive & Motorbike",
    imageSrc: file("automotive-motorbike"),
  },
  { slug: "books-stationery", label: "Books & Stationery", imageSrc: file("books-stationery") },
  {
    slug: "musical-instruments",
    label: "Musical Instruments",
    imageSrc: file("musical-instruments"),
  },
  { slug: "pet-supplies", label: "Pet Supplies", imageSrc: file("pet-supplies") },
  {
    slug: "local-nepali-handmade",
    label: "Local Nepali & Handmade",
    imageSrc: file("local-nepali-handmade"),
  },
];

// slug → image, for O(1) lookup when rendering a backend-driven category tile.
export const categoryImageBySlug: Record<string, CategoryImage> = Object.fromEntries(
  CATEGORY_IMAGES.map((c) => [c.slug, c]),
);

// Legacy production category ids reuse the closest curated image (mirrors the
// retired CATEGORY_ICON_SRC aliases) so older catalogs never render a blank tile.
const LEGACY_ALIASES: Record<string, string> = {
  electronics: "electronics-gadgets",
  fashion: "fashion-clothing",
  "health-beauty": "health-wellness",
  "home-living": "home-decor",
  "mother-baby-kids": "baby-kids-toys",
  "sports-outdoors": "sports-fitness-outdoors",
  automotive: "automotive-motorbike",
  "crafts-heritage": "local-nepali-handmade",
  "digital-goods-services": "computers-accessories",
};
for (const [legacy, canonical] of Object.entries(LEGACY_ALIASES)) {
  const image = categoryImageBySlug[canonical];
  if (image) categoryImageBySlug[legacy] = image;
}
