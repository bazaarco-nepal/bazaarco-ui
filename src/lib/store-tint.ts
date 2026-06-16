// Deterministic brand tint for a store, hashed from its NAME so the same shop
// always gets the same colour everywhere it appears (directory card, seller
// sidebar, store-link preview) and the grid reads as intentional, not random.
// Returns a key into the store monogram palette (STORE_TINTS, below).
const TINT_KEYS = ["blue", "red", "green", "saffron", "gold", "slate", "teal", "purple"] as const;

export type TintKey = (typeof TINT_KEYS)[number];

export function tintForName(name: string | null | undefined): TintKey {
  const s = (name ?? "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    // djb2-style rolling hash, kept unsigned so the modulo never goes negative.
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return TINT_KEYS[hash % TINT_KEYS.length]!;
}

// A store monogram tile: a soft brand-tint background with same-family "ink" for
// the fallback letter, plus a slightly deeper border. Every pair is drawn from
// the BazaarCo brand palette and contrast-checked so the letter stays legible on
// its tile. Dedicated to the store monogram (StoreAvatar) — kept separate from
// the shared TINTS tuple in components/ui/kit.tsx, which other surfaces consume.
export interface StoreTint {
  bg: string;
  ink: string;
  border: string;
}

export const STORE_TINTS: Record<TintKey, StoreTint> = {
  teal: { bg: "#E1F5EE", ink: "#0F6E56", border: "#9FE1CB" },
  green: { bg: "#EAF3DE", ink: "#3B6D11", border: "#C0DD97" },
  blue: { bg: "#E6F1FB", ink: "#185FA5", border: "#B5D4F4" },
  saffron: { bg: "#FAECE7", ink: "#993C1D", border: "#F5C4B3" },
  gold: { bg: "#FAEEDA", ink: "#854F0B", border: "#FAC775" },
  purple: { bg: "#EEEDFE", ink: "#534AB7", border: "#CECBF6" },
  slate: { bg: "#F1EFE8", ink: "#444441", border: "#D3D1C7" },
  red: { bg: "#FCEBEB", ink: "#A32D2D", border: "#F7C1C1" },
};
