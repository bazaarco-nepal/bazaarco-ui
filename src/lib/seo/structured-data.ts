/**
 * Schema.org structured data (JSON-LD) builders.
 *
 * JSON-LD is how Google understands *what* a page represents beyond plain text:
 * the Organization + WebSite graph powers the knowledge panel and sitelinks
 * search box; Product/Store power rich results (price, stars). Every builder
 * returns a plain object that <JsonLd> serializes into a script tag.
 */
import { SITE_LOGO_URL, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/config/site";

type Json = Record<string, unknown>;

/** Identifies the brand and links it to its verified social accounts. */
export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO_URL,
    sameAs: Object.values(SOCIAL_LINKS),
  };
}

/** Declares the site search so Google can show a sitelinks search box. */
export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  url: string;
  description?: string;
  image?: string;
  brand?: string | null;
  sku?: string | null;
  /** Price in rupees (major units), already converted from paisa. */
  price?: number;
  outOfStock?: boolean;
  rating?: number;
  reviewCount?: number;
}

export function productSchema(p: ProductSchemaInput): Json {
  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    url: p.url,
  };
  if (p.description) schema.description = p.description;
  if (p.image) schema.image = p.image;
  if (p.brand) schema.brand = { "@type": "Brand", name: p.brand };
  if (p.sku) schema.sku = p.sku;

  if (typeof p.price === "number") {
    schema.offers = {
      "@type": "Offer",
      price: p.price.toFixed(2),
      priceCurrency: "NPR",
      availability: p.outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: p.url,
    };
  }
  // Google rejects an aggregateRating with no ratings — only emit when real.
  if (p.rating && p.reviewCount && p.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.rating,
      reviewCount: p.reviewCount,
    };
  }
  return schema;
}

export interface StoreSchemaInput {
  name: string;
  url: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
}

export function storeSchema(s: StoreSchemaInput): Json {
  const schema: Json = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: s.name,
    url: s.url,
  };
  if (s.image) schema.image = s.image;
  if (s.rating && s.reviewCount && s.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: s.rating,
      reviewCount: s.reviewCount,
    };
  }
  return schema;
}
