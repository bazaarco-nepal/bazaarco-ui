/**
 * Canonical public origin and brand strings.
 *
 * Single source of truth for SEO surfaces — the root metadata (layout.tsx),
 * the sitemap, robots.txt, and every per-page generateMetadata all read from
 * here so the brand and domain never drift between them.
 */
export const SITE_URL = "https://bazaarconepal.com";
export const SITE_NAME = "BazaarCo";
export const SITE_TITLE = "BazaarCo - Nepal's Video-First Marketplace";
export const SITE_DESCRIPTION =
  "Shop products through videos from verified sellers across Nepal on BazaarCo, Nepal's video-first marketplace.";

/** Default social share image (served from /public). */
export const OG_IMAGE = "/open-graph.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
