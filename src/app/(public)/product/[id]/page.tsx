import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/config/site";
import { fetchProductSeo, truncate } from "@/shared/lib/seo/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, productSchema } from "@/shared/lib/seo/structured-data";

// The root layout reads the locale cookie (dynamic), so this route can't be
// statically/ISR-rendered — declaring `revalidate` here caused a static/dynamic
// conflict (DYNAMIC_SERVER_USAGE) that 500'd every product page. Render per
// request; metadata + JSON-LD are still emitted, so SEO is unaffected.
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductSeo(id);
  // Fall back to the root layout's site-wide metadata when the product can't be
  // resolved (bad id, backend down) — never emit a broken or empty title.
  if (!product) return {};

  const title = `${product.name} | ${SITE_NAME}`;
  const description = product.description?.trim()
    ? truncate(product.description)
    : `Buy ${product.name} from a verified seller on ${SITE_NAME}, Nepal's video-first marketplace.`;
  const url = `${SITE_URL}/product/${encodeURIComponent(id)}`;
  const image = product.image ?? OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, alt: product.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// The product UI is rendered client-side by the marketplace shell; this route
// contributes server-rendered Product JSON-LD (rich results) and metadata. The
// fetch is memoized with the one in generateMetadata, so it's a single call.
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await fetchProductSeo(id);
  if (!product) return null;

  const url = `${SITE_URL}/product/${encodeURIComponent(id)}`;

  return (
    <>
      <JsonLd
        data={productSchema({
          name: product.name,
          url,
          description: product.description ? truncate(product.description, 300) : undefined,
          image: product.image,
          brand: product.brand,
          sku: product.sku,
          price: product.price,
          outOfStock: product.outOfStock,
          rating: product.rating,
          reviewCount: product.reviewCount,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: `${SITE_URL}/home` },
          ...(product.category
            ? [
                {
                  name: product.category,
                  url: `${SITE_URL}/browse?category=${encodeURIComponent(product.category)}`,
                },
              ]
            : []),
          { name: product.name, url },
        ])}
      />
    </>
  );
}
