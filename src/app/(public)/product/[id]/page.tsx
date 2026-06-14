import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/config/site";
import { fetchProductSeo, truncate } from "@/lib/seo/catalog";

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

// Body is rendered client-side by the marketplace shell in (public)/layout.tsx;
// this route exists for server metadata + a crawlable URL.
export default function ProductPage() {
  return null;
}
