"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, AppLink } from "@/components/ui";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import type { HeroSlide } from "@/services/api/home";
import { HeroBannerRenderer } from "@bazaarco/hero-banner/renderer";
import type { HeroBannerHost } from "@bazaarco/hero-banner/renderer/host";

/* Homepage hero — block-composed banners from the shared renderer so buyer UI
   and admin preview can never drift. When the API returns no banners the section
   is omitted upstream — no placeholder fallback. */

const ROTATE_MS = 6000;

const buyerHost: HeroBannerHost = {
  Link: ({ href, children, style, className }) => (
    <AppLink href={href} style={style} className={className}>
      {children}
    </AppLink>
  ),
  Icon: ({ name, size, color }) => <Icon name={name as "arrowRight"} size={size} color={color} />,
  cloudinaryUrl: (url, opts) => cloudinaryImageUrl(url, opts),
};

function useRotation(count: number) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  return { index, setIndex, paused };
}

function Dots({
  count,
  index,
  onSelect,
}: {
  count: number;
  index: number;
  onSelect: (i: number) => void;
}) {
  if (count < 2) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: 0,
        right: 0,
        zIndex: 4,
        display: "flex",
        justifyContent: "center",
        gap: 7,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Show banner ${i + 1} of ${count}`}
          aria-current={i === index}
          onClick={() => onSelect(i)}
          className="bz-hover-dim"
          style={{
            width: i === index ? 22 : 8,
            height: 8,
            borderRadius: "var(--r-full)",
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: i === index ? "var(--ink-900)" : "rgba(15,23,42,.3)",
            transition: "width var(--dur-standard) var(--ease)",
          }}
        />
      ))}
    </div>
  );
}

function HeroCarousel({ slides, device }: { slides: HeroSlide[]; device: "desktop" | "mobile" }) {
  const list = slides ?? [];
  const { index, setIndex, paused } = useRotation(list.length);
  const active = list[index] ?? list[0];
  if (!active) return null;

  return (
    <div
      style={{ position: "relative" }}
      role="region"
      aria-label="Featured promotions"
      aria-roledescription={list.length > 1 ? "carousel" : undefined}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <HeroBannerRenderer
        content={active.content}
        context={{
          sponsored: active.sponsored,
          campaignLabel: active.campaignLabel,
          sponsorName: active.sponsorName,
          bannerEndsAt: active.endsAt,
        }}
        host={buyerHost}
        useCssVars
        device={device}
      />
      <Dots count={list.length} index={index} onSelect={setIndex} />
    </div>
  );
}

export function BestPicksHero({ slides }: { slides?: HeroSlide[] | null }) {
  const list = slides ?? [];
  if (!list.length) return null;
  return <HeroCarousel slides={list} device="desktop" />;
}

export function BestPicksBanner({ slides }: { slides?: HeroSlide[] | null }) {
  const list = slides ?? [];
  if (!list.length) return null;
  return <HeroCarousel slides={list} device="mobile" />;
}
