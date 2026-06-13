import type { HeroBannerContent, HeroTemplateId } from "./types.js";

function blockId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

const PLACEHOLDER_IMAGE = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";

/** Starter layouts so admins aren't staring at a blank canvas. Copy is neutral
 *  house voice — they replace it before publishing. */
export function heroTemplate(id: HeroTemplateId): HeroBannerContent {
  switch (id) {
    case "image_left":
      return {
        layout: "image_left",
        blocks: [
          { id: blockId(), type: "background", tint: "red" },
          {
            id: blockId(),
            type: "headline",
            text: "Discover local favorites",
            size: "lg",
            align: "left",
          },
          {
            id: blockId(),
            type: "subtitle",
            text: "Handpicked from verified Nepali stores",
            size: "md",
            align: "left",
          },
          {
            id: blockId(),
            type: "button",
            ctaLabel: "Browse stores",
            ctaHref: "/search",
            size: "md",
          },
          {
            id: blockId(),
            type: "image",
            imageUrl: PLACEHOLDER_IMAGE,
            imageAlt: "Featured products collage",
          },
        ],
      };

    case "image_right":
      return {
        layout: "image_right",
        blocks: [
          { id: blockId(), type: "background", tint: "red" },
          {
            id: blockId(),
            type: "headline",
            text: "Shop the season",
            size: "lg",
            align: "left",
          },
          {
            id: blockId(),
            type: "accent",
            text: "Fresh picks for you",
            size: "lg",
            align: "left",
          },
          {
            id: blockId(),
            type: "subtitle",
            text: "Deals from stores you trust",
            size: "md",
            align: "left",
          },
          {
            id: blockId(),
            type: "button",
            ctaLabel: "Shop now",
            ctaHref: "/search",
            size: "md",
          },
          {
            id: blockId(),
            type: "image",
            imageUrl: PLACEHOLDER_IMAGE,
            imageAlt: "Seasonal promotion",
          },
        ],
      };

    case "overlay":
      return {
        layout: "overlay",
        blocks: [
          { id: blockId(), type: "background", tint: "blue" },
          {
            id: blockId(),
            type: "image",
            imageUrl: PLACEHOLDER_IMAGE,
            imageAlt: "Full-width campaign visual",
          },
          {
            id: blockId(),
            type: "headline",
            text: "Limited-time offer",
            size: "xl",
            align: "center",
          },
          {
            id: blockId(),
            type: "accent",
            text: "Ends soon",
            size: "md",
            align: "center",
          },
          {
            id: blockId(),
            type: "button",
            ctaLabel: "Grab the deal",
            ctaHref: "/search",
            size: "md",
          },
        ],
      };

    case "text_only":
      return {
        layout: "text_only",
        blocks: [
          { id: blockId(), type: "background", tint: "saffron" },
          {
            id: blockId(),
            type: "headline",
            text: "Welcome to BazaarCo",
            size: "xl",
            align: "center",
          },
          {
            id: blockId(),
            type: "subtitle",
            text: "Nepal's marketplace for buyers and sellers",
            size: "md",
            align: "center",
          },
          {
            id: blockId(),
            type: "button",
            ctaLabel: "Start shopping",
            ctaHref: "/search",
            size: "md",
          },
        ],
      };
  }
}

export const HERO_TEMPLATE_OPTIONS: { id: HeroTemplateId; label: string }[] = [
  { id: "image_left", label: "Image left" },
  { id: "image_right", label: "Image right" },
  { id: "overlay", label: "Full-bleed overlay" },
  { id: "text_only", label: "Text only" },
];
