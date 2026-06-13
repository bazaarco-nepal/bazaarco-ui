/** Block-composed homepage hero banners — shared contract for core API, buyer UI,
 *  and admin preview. One shape everywhere so preview and production never drift. */

export const HERO_BLOCK_TYPES = [
  "background",
  "headline",
  "accent",
  "subtitle",
  "button",
  "sponsor_pill",
  "image",
  "countdown",
  "spacer",
] as const;

export const HERO_LAYOUTS = [
  "image_left",
  "image_right",
  "image_above",
  "image_below",
  "text_only",
  "overlay",
] as const;

export const HERO_TINTS = ["red", "blue", "saffron"] as const;
export const HERO_ALIGNS = ["left", "center", "right"] as const;
export const HERO_SIZES = ["sm", "md", "lg", "xl"] as const;
export const HERO_SPACER_HEIGHTS = ["sm", "md", "lg"] as const;

export type HeroBlockType = (typeof HERO_BLOCK_TYPES)[number];
export type HeroLayout = (typeof HERO_LAYOUTS)[number];
export type HeroTint = (typeof HERO_TINTS)[number];
export type HeroAlign = (typeof HERO_ALIGNS)[number];
export type HeroSize = (typeof HERO_SIZES)[number];
export type HeroSpacerHeight = (typeof HERO_SPACER_HEIGHTS)[number];

/** Hard cap — banners stay scannable on mobile and cheap to render. */
export const MAX_HERO_BLOCKS = 15;

export type HeroBlock = {
  id: string;
  type: HeroBlockType;
  align?: HeroAlign;
  size?: HeroSize;
  tint?: HeroTint;
  text?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  imageAlt?: string;
  imagePublicId?: string | null;
  /** ISO datetime the countdown counts down to. */
  targetAt?: string | null;
  height?: HeroSpacerHeight;
};

export type HeroBannerContent = {
  layout: HeroLayout;
  blocks: HeroBlock[];
};

/** Paid-placement + schedule fields sit on the banner row, not inside blocks. */
export type HeroBannerContext = {
  sponsorName?: string | null;
  campaignLabel?: string | null;
  sponsored?: boolean;
  bannerEndsAt?: string | null;
};

export type HeroBannerSlide = {
  id: string;
  content: HeroBannerContent;
} & HeroBannerContext;

/** Pre-Phase-3 scalar columns — still returned for the legacy admin form until
 *  the block editor ships; always derived from `content` on the server. */
export type HeroLegacyFields = {
  title: string;
  accent: string | null;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
  tint: HeroTint;
};

export type HeroTemplateId = "image_left" | "image_right" | "overlay" | "text_only";
