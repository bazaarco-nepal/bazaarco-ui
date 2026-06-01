/**
 * Static asset paths served from `public/assets/`.
 * Run `npm run sync:assets` after updating bazaarco-design asset folders.
 */
export const ASSETS = {
  logo: "/assets/bazaarco-logo.png",
  logoBlue: "/assets/bazaarco-logo-blue.png",
  logoHighQuality: "/assets/logos/logo-high-quality.png",
  mascot: "/assets/hiro.png",
  skyline: "/assets/kathmandu-skyline.png",
  companySeal: "/assets/company-seal.png",
  companySealEssentials: "/assets/logos/company-seal-essentials.png",
  companyStamp: "/assets/logos/company-stamp.png",
  logos: {
    variant1: "/assets/logos/variant-1.png",
    variant2: "/assets/logos/variant-2.png",
    variant3: "/assets/logos/variant-3.png",
    variant4: "/assets/logos/variant-4.png",
    variant5: "/assets/logos/variant-5.png",
    variant6: "/assets/logos/variant-6.png",
    variant7: "/assets/logos/variant-7.png",
    variant8: "/assets/logos/variant-8.png",
    variant9: "/assets/logos/variant-9.png",
    fluxHq: "/assets/logos/logo-flux-hq.jpeg",
  },
  promotions: {
    hiro: "/assets/promotions/hiro-promo.png",
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

export type AssetPath = (typeof ASSETS)[keyof typeof ASSETS] extends string
  ? (typeof ASSETS)[keyof typeof ASSETS]
  : string;
