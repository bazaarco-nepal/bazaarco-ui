// Deterministic brand tint for a store, hashed from its NAME so the same shop
// always gets the same colour everywhere it appears (directory card, seller
// sidebar, store-link preview) and the grid reads as intentional, not random.
// Returns a key into the shared TINTS palette (see components/ui/kit.tsx).
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
