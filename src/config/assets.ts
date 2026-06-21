/**
 * Static asset paths served from `public/assets/`.
 */
export const ASSETS = {
  logo: "/assets/bazaarco-logo.png",
  mascot: "/hiro/generic-hero.png",
  skyline: "/assets/kathmandu-skyline.png",
  // Homepage hero slides (from the revamp prototype). DEBT: hardcoded marketing
  // slides — owner to wire admin-managed hero banners later.
  hero: {
    bargain: "/assets/hero/hero-bargain.png",
    watch: "/assets/hero/hero-watch.png",
    delivery: "/assets/hero/hero-delivery.png",
  },
} as const;
