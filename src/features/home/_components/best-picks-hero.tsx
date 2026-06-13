"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, AppLink } from "@/components/ui";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import type { HeroSlide } from "@/services/api/home";

/* Homepage hero — 100% admin-managed banners rendered in BazaarCo's fixed
   split-hero template. Admins own all CONTENT (image, copy, link, theme); the
   layout never changes and nothing is hardcoded. One shared design, two
   responsive renders (desktop split + mobile band) so they can't drift. When the
   API returns no banners the hero renders nothing — the homepage simply omits
   the section rather than showing placeholder content. */

type Theme = { wash: string; accent: string; glow: string; shadow: string };

const RED_THEME: Theme = {
  wash: "linear-gradient(120deg, var(--tint-red-50) 0%, #ffe1e4 52%, #ffd0d5 100%)",
  accent: "var(--red)",
  glow: "rgba(230,57,70,.28)",
  shadow: "rgba(230,57,70,.22)",
};

const TINTS: Record<string, Theme> = {
  red: RED_THEME,
  blue: {
    wash: "linear-gradient(120deg,#eef4ff 0%,#dbe8ff 52%,#c7dbff 100%)",
    accent: "var(--blue)",
    glow: "rgba(29,78,216,.26)",
    shadow: "rgba(29,78,216,.22)",
  },
  saffron: {
    wash: "linear-gradient(120deg,#fff7e8 0%,#ffe9c2 52%,#ffd99a 100%)",
    accent: "var(--saffron)",
    glow: "rgba(247,127,0,.28)",
    shadow: "rgba(247,127,0,.22)",
  },
};

const themeFor = (tint: string): Theme => TINTS[tint] ?? RED_THEME;

const ROTATE_MS = 6000;

/** Auto-rotating index for multi-slide carousels. Pauses on hover and respects
 * reduced-motion (no auto-advance), but manual dots always work. */
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

function SponsoredChip({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 3,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: "var(--r-full)",
        background: "rgba(15,23,42,.78)",
        color: "#fff",
        fontSize: ".6875rem",
        fontWeight: 700,
        letterSpacing: ".03em",
        textTransform: "uppercase",
      }}
    >
      <Icon name="badgeCheck" size={12} color="#fff" />
      {label}
    </span>
  );
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

function Spotlight({
  slide,
  px,
  box,
  glow,
  theme,
}: {
  slide: HeroSlide;
  px: number; // Cloudinary request size (square crop) + intrinsic ratio
  box: number | string; // rendered CSS size — a clamp() string makes it fluid
  glow: number;
  theme: Theme;
}) {
  const src = cloudinaryImageUrl(slide.imageUrl, { width: px, height: px }) || slide.imageUrl;
  return (
    <div
      style={{
        position: "relative",
        width: box,
        height: box,
        aspectRatio: "1 / 1",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 50%, ${theme.glow}, rgba(0,0,0,0) 70%)`,
          filter: `blur(${glow}px)`,
        }}
      />
      <img
        src={src}
        alt={slide.imageAlt}
        width={px}
        height={px}
        loading="eager"
        decoding="async"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "var(--r-xl)",
          boxShadow: `0 18px 40px ${theme.shadow}`,
        }}
      />
    </div>
  );
}

function CtaPill({ slide, theme, size }: { slide: HeroSlide; theme: Theme; size: "lg" | "sm" }) {
  const lg = size === "lg";
  return (
    <AppLink
      href={slide.ctaHref}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: theme.accent,
        color: "#fff",
        fontWeight: 700,
        borderRadius: "var(--r-full)",
        padding: lg ? "0 26px" : "0 16px",
        height: lg ? 52 : 36,
        fontSize: lg ? "1.125rem" : ".875rem",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {slide.ctaLabel}
      <Icon name="arrowRight" size={lg ? 20 : 16} color="#fff" />
    </AppLink>
  );
}

/* ---------- Desktop ---------- */
function DesktopSlide({ slide }: { slide: HeroSlide }) {
  const theme = themeFor(slide.tint);
  return (
    <div
      className="bz-split-hero"
      style={{
        position: "relative",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        background: theme.wash,
      }}
    >
      {slide.sponsored && <SponsoredChip label={slide.campaignLabel || "Sponsored"} />}
      <div
        className="fade-up"
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          padding: "56px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 560,
        }}
      >
        <h1
          className="bz-hero-h1"
          style={{ margin: 0, fontWeight: 800, color: "var(--ink-900)", letterSpacing: "-.02em" }}
        >
          {slide.title}
          {slide.accent && (
            <>
              <br />
              <span style={{ color: theme.accent }}>{slide.accent}</span>
            </>
          )}
        </h1>
        {slide.subtitle && (
          <p
            style={{
              color: "var(--ink-500)",
              fontSize: "1.0625rem",
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            {slide.subtitle}
          </p>
        )}
        <div style={{ marginTop: 30 }}>
          <CtaPill slide={slide} theme={theme} size="lg" />
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 56px",
        }}
      >
        <Spotlight slide={slide} px={320} box={300} glow={26} theme={theme} />
      </div>
    </div>
  );
}

export function BestPicksHero({ slides }: { slides?: HeroSlide[] | null }) {
  const list = slides ?? [];
  const { index, setIndex, paused } = useRotation(list.length);
  const active = list[index] ?? list[0];
  // No banner from the API → render nothing (the section is omitted upstream too).
  if (!active) return null;
  return (
    <div
      style={{ position: "relative" }}
      role="region"
      aria-label="Featured promotions"
      aria-roledescription="carousel"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <DesktopSlide slide={active} />
      <Dots count={list.length} index={index} onSelect={setIndex} />
    </div>
  );
}

/* ---------- Mobile (compact band) ---------- */
/* Fully fluid: every size is a clamp() so it adapts from a 320px phone up to a
   tablet without a media query. Text column flexes; the image scales with the
   viewport and never pushes the copy off-screen. */
function MobileSlide({ slide }: { slide: HeroSlide }) {
  const theme = themeFor(slide.tint);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--r-xl)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        minHeight: "clamp(112px, 30vw, 148px)",
        background: theme.wash,
      }}
    >
      {slide.sponsored && <SponsoredChip label={slide.campaignLabel || "Sponsored"} />}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "clamp(14px, 4vw, 20px) 0 clamp(14px, 4vw, 20px) clamp(16px, 4.5vw, 22px)",
        }}
      >
        <div
          style={{
            fontSize: "clamp(1.0625rem, 4.6vw, 1.375rem)",
            fontWeight: 800,
            color: "var(--ink-900)",
            lineHeight: 1.15,
            letterSpacing: "-.01em",
          }}
        >
          {slide.title}
          {slide.accent && (
            <>
              <br />
              <span style={{ color: theme.accent }}>{slide.accent}</span>
            </>
          )}
        </div>
        {slide.subtitle && (
          <p
            style={{
              fontSize: "clamp(.8125rem, 3.4vw, .9375rem)",
              color: "var(--ink-500)",
              margin: "6px 0 10px",
              lineHeight: 1.38,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {slide.subtitle}
          </p>
        )}
        <div style={{ marginTop: slide.subtitle ? 0 : 10 }}>
          <CtaPill slide={slide} theme={theme} size="sm" />
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: "0 clamp(14px, 4vw, 20px)" }}>
        <Spotlight slide={slide} px={200} box="clamp(76px, 24vw, 116px)" glow={12} theme={theme} />
      </div>
    </div>
  );
}

export function BestPicksBanner({ slides }: { slides?: HeroSlide[] | null }) {
  const list = slides ?? [];
  const { index, setIndex } = useRotation(list.length);
  const active = list[index] ?? list[0];
  if (!active) return null;
  return (
    <div style={{ position: "relative" }} role="region" aria-label="Featured promotions">
      <MobileSlide slide={active} />
      <Dots count={list.length} index={index} onSelect={setIndex} />
    </div>
  );
}
