"use client";

import { useEffect, useRef, useState } from "react";
import { AppLink, Icon } from "@/components/ui";
import { ASSETS } from "@/config/assets";
import { browsePath } from "@/config/routes";

// DEBT: hardcoded marketing hero slides (revamp prototype). Owner dropped the
// admin-managed hero banners — revisit if dynamic banners are needed again.
// Every slide opens the full product listing (all products), on both breakpoints.
const SLIDES = [
  {
    src: ASSETS.hero.bargain,
    alt: "Bargain with sellers — get the best deal inside the app",
    href: browsePath(),
  },
  {
    src: ASSETS.hero.watch,
    alt: "Real product videos — watch before you buy",
    href: browsePath(),
  },
  {
    src: ASSETS.hero.delivery,
    alt: "Lowest delivery charge for multi-seller orders",
    href: browsePath(),
  },
];

const ROTATE_MS = 6000;

export function HomeHero() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const count = SLIDES.length;

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  const go = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <div
      className="bz-hero"
      role="region"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="bz-hero__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((s) => (
          <AppLink key={s.src} href={s.href} ariaLabel={s.alt} className="bz-hero__slide">
            <img src={s.src} alt={s.alt} className="bz-hero__img" draggable={false} />
          </AppLink>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous banner"
        className="bz-hero__arrow bz-hero__arrow--prev"
        onClick={() => go(index - 1)}
      >
        <Icon name="chevronLeft" size={20} color="#fff" />
      </button>
      <button
        type="button"
        aria-label="Next banner"
        className="bz-hero__arrow bz-hero__arrow--next"
        onClick={() => go(index + 1)}
      >
        <Icon name="chevronRight" size={20} color="#fff" />
      </button>

      <div className="bz-hero__dots">
        {SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Show banner ${i + 1} of ${count}`}
            aria-current={i === index}
            className="bz-hero__dot"
            data-active={i === index}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
