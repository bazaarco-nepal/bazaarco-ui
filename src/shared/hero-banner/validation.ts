import { bannerTint, themeForTint } from "./themes.js";
import {
  HERO_ALIGNS,
  HERO_BLOCK_TYPES,
  HERO_LAYOUTS,
  HERO_SIZES,
  HERO_SPACER_HEIGHTS,
  HERO_TINTS,
  MAX_HERO_BLOCKS,
  type HeroBannerContent,
  type HeroBlock,
} from "./types.js";

export type HeroValidationIssue = {
  code: string;
  message: string;
  blockId?: string;
};

export type HeroPublishValidation = {
  ok: boolean;
  errors: HeroValidationIssue[];
  warnings: HeroValidationIssue[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Structural check — used at the API boundary before Zod refinement. */
export function isHeroBannerContent(value: unknown): value is HeroBannerContent {
  if (!isRecord(value)) return false;
  if (!HERO_LAYOUTS.includes(value.layout as HeroBannerContent["layout"])) return false;
  if (!Array.isArray(value.blocks)) return false;
  if (value.blocks.length > MAX_HERO_BLOCKS) return false;

  return value.blocks.every((raw) => {
    if (!isRecord(raw)) return false;
    if (!isNonEmptyString(raw.id)) return false;
    if (!HERO_BLOCK_TYPES.includes(raw.type as HeroBlock["type"])) return false;
    return true;
  });
}

/** Rules that must pass before a banner goes live. Warnings (contrast) never block. */
export function validateForPublish(content: HeroBannerContent): HeroPublishValidation {
  const errors: HeroValidationIssue[] = [];
  const warnings: HeroValidationIssue[] = [];

  if (content.blocks.length === 0) {
    errors.push({ code: "EMPTY_BANNER", message: "Add at least one block before publishing." });
  }

  if (content.blocks.length > MAX_HERO_BLOCKS) {
    errors.push({
      code: "TOO_MANY_BLOCKS",
      message: `Banners can have at most ${MAX_HERO_BLOCKS} blocks.`,
    });
  }

  const hasHeadline = content.blocks.some((b) => b.type === "headline" && isNonEmptyString(b.text));
  if (!hasHeadline) {
    errors.push({
      code: "MISSING_HEADLINE",
      message: "Every published banner needs at least one Headline block.",
    });
  }

  for (const block of content.blocks) {
    if (block.type === "image" && !isNonEmptyString(block.imageAlt)) {
      errors.push({
        code: "MISSING_IMAGE_ALT",
        message: "Every Image block needs alt text before publishing.",
        blockId: block.id,
      });
    }

    if (block.type === "button") {
      if (!isNonEmptyString(block.ctaLabel)) {
        errors.push({
          code: "MISSING_BUTTON_LABEL",
          message: "Button blocks need a label.",
          blockId: block.id,
        });
      }
      if (!isNonEmptyString(block.ctaHref)) {
        errors.push({
          code: "MISSING_BUTTON_LINK",
          message: "Button blocks need an internal link.",
          blockId: block.id,
        });
      }
    }
  }

  const tint = bannerTint(content);
  const theme = themeForTint(tint);
  const contrast = contrastRatio(theme.inkOnWashHex, washMidHex(theme.washHex));
  if (contrast < 4.5) {
    warnings.push({
      code: "LOW_CONTRAST",
      message: "Text may be hard to read on this background — try a darker theme or shorter copy.",
    });
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** WCAG relative luminance contrast ratio between two #rrggbb colors. */
function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = relativeLuminance(fgHex);
  const bg = relativeLuminance(bgHex);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3 ? clean.replace(/./g, "$&$&") : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Pick a mid-tone from the gradient string for a rough contrast estimate. */
function washMidHex(wash: string): string {
  const match = wash.match(/#([0-9a-fA-F]{6})/g);
  if (!match?.length) return "#ffffff";
  return match[Math.floor(match.length / 2)] ?? "#ffffff";
}

export function normalizeBlock(raw: HeroBlock): HeroBlock {
  const base: HeroBlock = { id: raw.id, type: raw.type };

  if (raw.align && HERO_ALIGNS.includes(raw.align)) base.align = raw.align;
  if (raw.size && HERO_SIZES.includes(raw.size)) base.size = raw.size;
  if (raw.tint && HERO_TINTS.includes(raw.tint)) base.tint = raw.tint;
  if (raw.text?.trim()) base.text = raw.text.trim();
  if (raw.ctaLabel?.trim()) base.ctaLabel = raw.ctaLabel.trim();
  if (raw.ctaHref?.trim()) base.ctaHref = raw.ctaHref.trim();
  if (raw.imageUrl?.trim()) base.imageUrl = raw.imageUrl.trim();
  if (raw.imageAlt !== undefined) base.imageAlt = raw.imageAlt.trim();
  if (raw.imagePublicId !== undefined) base.imagePublicId = raw.imagePublicId;
  if (raw.targetAt !== undefined) base.targetAt = raw.targetAt;
  if (raw.height && HERO_SPACER_HEIGHTS.includes(raw.height)) base.height = raw.height;

  return base;
}

export function normalizeContent(raw: HeroBannerContent): HeroBannerContent {
  return {
    layout: raw.layout,
    blocks: raw.blocks.map(normalizeBlock),
  };
}
