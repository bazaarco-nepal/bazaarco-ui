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

/**
 * PWA browser-chrome colors. Mirror `--blue` and `--page` in styles/tokens.css —
 * the manifest and theme-color meta are JSON/HTML, so they can't read CSS vars;
 * keep these in sync if the tokens change.
 */
export const THEME_COLOR = "#1d4ed8";
export const BACKGROUND_COLOR = "#f8fafc";

/** Default social share image (served from /public). */
export const OG_IMAGE = "/open-graph.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Absolute logo URL — used by Organization structured data. */
export const SITE_LOGO_URL = `${SITE_URL}/assets/bazaarco-logo.png`;

/**
 * Official social profiles. Single source of truth for the footer links and the
 * Organization `sameAs` structured data (which is what links the site to its
 * social accounts in Google's knowledge panel).
 */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/bazaar.co.nepal/",
  tiktok: "https://www.tiktok.com/@bazaarco.nepal?_r=1&_t=ZS-973wPgozpKq",
  facebook: "https://www.facebook.com/profile.php?id=61589936558399",
  linkedin: "https://www.linkedin.com/company/bazaarco",
} as const;
