import type { HeroSize, HeroSpacerHeight } from "./types.js";

export const HERO_SIZE_STYLES: Record<
  HeroSize,
  { fontSize: string; lineHeight: number; fontWeight: number }
> = {
  sm: { fontSize: "0.9375rem", lineHeight: 1.4, fontWeight: 600 },
  md: { fontSize: "1.0625rem", lineHeight: 1.45, fontWeight: 700 },
  lg: { fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.15, fontWeight: 800 },
  xl: { fontSize: "clamp(1.75rem, 5vw, 2.75rem)", lineHeight: 1.1, fontWeight: 800 },
};

export const SPACER_HEIGHTS_PX: Record<HeroSpacerHeight, number> = {
  sm: 8,
  md: 16,
  lg: 32,
};
