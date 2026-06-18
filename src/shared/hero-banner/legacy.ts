import type { HeroBannerContent, HeroBlock, HeroLegacyFields, HeroTint } from "./types.js";

type LegacySlideInput = {
  title?: string;
  accent?: string | null;
  subtitle?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  imageAlt?: string;
  imagePublicId?: string | null;
  tint?: HeroTint;
};

function blockId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

/** Converts the pre-block scalar banner shape into a block list. Used by the DB
 *  backfill migration and as a transition path while the admin form still posts
 *  legacy fields. */
export function legacySlideToContent(
  slide: LegacySlideInput,
  layout: HeroBannerContent["layout"] = "image_right",
): HeroBannerContent {
  const tint = slide.tint ?? "red";
  const blocks: HeroBlock[] = [{ id: blockId(), type: "background", tint }];

  if (slide.title?.trim()) {
    blocks.push({
      id: blockId(),
      type: "headline",
      text: slide.title.trim(),
      size: "lg",
      align: "left",
    });
  }
  if (slide.accent?.trim()) {
    blocks.push({
      id: blockId(),
      type: "accent",
      text: slide.accent.trim(),
      size: "lg",
      align: "left",
    });
  }
  if (slide.subtitle?.trim()) {
    blocks.push({
      id: blockId(),
      type: "subtitle",
      text: slide.subtitle.trim(),
      size: "md",
      align: "left",
    });
  }
  if (slide.ctaLabel?.trim() && slide.ctaHref?.trim()) {
    blocks.push({
      id: blockId(),
      type: "button",
      ctaLabel: slide.ctaLabel.trim(),
      ctaHref: slide.ctaHref.trim(),
      size: "md",
    });
  }
  if (slide.imageUrl?.trim()) {
    blocks.push({
      id: blockId(),
      type: "image",
      imageUrl: slide.imageUrl.trim(),
      imageAlt: slide.imageAlt?.trim() ?? "",
      imagePublicId: slide.imagePublicId ?? null,
    });
  }

  return { layout, blocks };
}

function firstBlock(blocks: HeroBlock[], type: HeroBlock["type"]): HeroBlock | undefined {
  return blocks.find((b) => b.type === type);
}

/** Derives scalar columns from blocks so the legacy admin form keeps working
 *  until Phase 4 replaces it with the block editor. */
export function contentToLegacyFields(content: HeroBannerContent): HeroLegacyFields {
  const { blocks } = content;
  const bg = firstBlock(blocks, "background");
  const headline = firstBlock(blocks, "headline");
  const accent = firstBlock(blocks, "accent");
  const subtitle = firstBlock(blocks, "subtitle");
  const button = firstBlock(blocks, "button");
  const image = firstBlock(blocks, "image");

  return {
    title: headline?.text?.trim() || "Untitled banner",
    accent: accent?.text?.trim() || null,
    subtitle: subtitle?.text?.trim() || null,
    ctaLabel: button?.ctaLabel?.trim() || "Shop now",
    ctaHref: button?.ctaHref?.trim() || "/search",
    imageUrl: image?.imageUrl?.trim() || "",
    imageAlt: image?.imageAlt?.trim() || "",
    tint: bg?.tint ?? "red",
  };
}

/** Human label for audit rows — first headline, else a neutral fallback. */
export function bannerLabelFromContent(content: HeroBannerContent): string {
  const headline = firstBlock(content.blocks, "headline");
  return headline?.text?.trim() || "Hero banner";
}
