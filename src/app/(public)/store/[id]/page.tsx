import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/config/site";
import { fetchSellerSeo } from "@/lib/seo/catalog";

interface StorePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await fetchSellerSeo(id);
  // Fall back to the root layout's site-wide metadata when the seller can't be
  // resolved (bad handle, backend down) — never emit a broken or empty title.
  if (!seller) return {};

  const title = `${seller.name} | ${SITE_NAME}`;
  const description = `Shop products from ${seller.name} on ${SITE_NAME}, Nepal's video-first marketplace. Watch product videos and order from a verified local seller.`;
  const url = `${SITE_URL}/store/${encodeURIComponent(id)}`;
  const image = seller.image ?? OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, alt: seller.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// Body is rendered client-side by the marketplace shell in (public)/layout.tsx;
// this route exists for server metadata + a crawlable URL.
export default function StorePage() {
  return null;
}
