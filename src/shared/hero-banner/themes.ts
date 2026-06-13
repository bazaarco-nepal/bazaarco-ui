import type { HeroTint } from "./types.js";

/** Theme tokens for hero banners. Buyer UI uses CSS variables; admin preview
 *  uses the hex fallbacks so the banner looks right inside the admin shell. */
export type HeroTheme = {
  wash: string;
  washHex: string;
  accent: string;
  accentHex: string;
  glow: string;
  shadow: string;
  inkOnWash: string;
  inkOnWashHex: string;
};

export const HERO_THEMES: Record<HeroTint, HeroTheme> = {
  red: {
    wash: "linear-gradient(120deg, var(--tint-red-50) 0%, #ffe1e4 52%, #ffd0d5 100%)",
    washHex: "linear-gradient(120deg,#fff5f5 0%,#ffe1e4 52%,#ffd0d5 100%)",
    accent: "var(--red)",
    accentHex: "#e63946",
    glow: "rgba(230,57,70,.28)",
    shadow: "rgba(230,57,70,.22)",
    inkOnWash: "var(--ink-900)",
    inkOnWashHex: "#0b1220",
  },
  blue: {
    wash: "linear-gradient(120deg,#eef4ff 0%,#dbe8ff 52%,#c7dbff 100%)",
    washHex: "linear-gradient(120deg,#eef4ff 0%,#dbe8ff 52%,#c7dbff 100%)",
    accent: "var(--blue)",
    accentHex: "#1d4ed8",
    glow: "rgba(29,78,216,.26)",
    shadow: "rgba(29,78,216,.22)",
    inkOnWash: "var(--ink-900)",
    inkOnWashHex: "#0b1220",
  },
  saffron: {
    wash: "linear-gradient(120deg,#fff7e8 0%,#ffe9c2 52%,#ffd99a 100%)",
    washHex: "linear-gradient(120deg,#fff7e8 0%,#ffe9c2 52%,#ffd99a 100%)",
    accent: "var(--saffron)",
    accentHex: "#f77f00",
    glow: "rgba(247,127,0,.28)",
    shadow: "rgba(247,127,0,.22)",
    inkOnWash: "var(--ink-900)",
    inkOnWashHex: "#0b1220",
  },
};

export function themeForTint(tint: HeroTint | string | undefined): HeroTheme {
  return HERO_THEMES[tint as HeroTint] ?? HERO_THEMES.red;
}

export function bannerTint(content: { blocks: { type: string; tint?: HeroTint }[] }): HeroTint {
  const bg = content.blocks.find((b) => b.type === "background");
  return bg?.tint ?? "red";
}
