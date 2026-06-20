/**
 * Static asset paths served from `public/assets/`.
 * Run `npm run sync:assets` after updating bazaarco-design asset folders.
 */
export const ASSETS = {
  logo: "/assets/bazaarco-logo.png",
  logoBlue: "/assets/bazaarco-logo-blue.png",
  mascot: "/Hiro%20Background%20Removed.png",
  skyline: "/assets/kathmandu-skyline.png",
  // Homepage hero slides (from the revamp prototype). DEBT: hardcoded marketing
  // slides — owner to wire admin-managed hero banners later.
  hero: {
    bargain: "/assets/hero/hero-bargain.png",
    watch: "/assets/hero/hero-watch.png",
    delivery: "/assets/hero/hero-delivery.png",
  },
  companySeal: "/assets/company-seal.png",
  promotions: {
    hiro: "/Hiro%20Background%20Removed.png",
    promo7870: "/assets/promotions/promo-7870.png",
    promo7873: "/assets/promotions/promo-7873.png",
    joinNowSeller: "/assets/promotions/join-now-seller.png",
    subomTodoList: "/assets/promotions/subom-todo-list.png",
    sponsoredS26Ultra: "/assets/promotions/sponsored-galaxy-s26-ultra.jpg",
  },
  howBazaarco: {
    step1: "/assets/how-bazaarco/step-1.png",
    step2: "/assets/how-bazaarco/step-2.png",
    step3: "/assets/how-bazaarco/step-3.png",
    step4: "/assets/how-bazaarco/step-4.png",
    step5: "/assets/how-bazaarco/step-5.png",
  },
} as const;
