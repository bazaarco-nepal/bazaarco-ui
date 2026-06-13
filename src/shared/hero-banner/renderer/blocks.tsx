"use client";

import { HERO_SIZE_STYLES, SPACER_HEIGHTS_PX } from "../constants";
import { themeForTint, type HeroTheme } from "../themes";
import type { HeroBannerContext, HeroBlock, HeroLayout, HeroTint } from "../types";
import { alignStyle, type HeroBannerHost } from "./host";

type BlockProps = {
  block: HeroBlock;
  theme: HeroTheme;
  useCssVars: boolean;
  host: HeroBannerHost;
  context: HeroBannerContext;
  compact?: boolean;
  layout: HeroLayout;
};

function pickTheme(theme: HeroTheme, useCssVars: boolean) {
  return {
    wash: useCssVars ? theme.wash : theme.washHex,
    accent: useCssVars ? theme.accent : theme.accentHex,
    ink: useCssVars ? theme.inkOnWash : theme.inkOnWashHex,
    glow: theme.glow,
    shadow: theme.shadow,
  };
}

export function BackgroundBlock({ block, theme, useCssVars }: BlockProps) {
  const t = pickTheme(theme, useCssVars);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background: t.wash,
        zIndex: 0,
      }}
      data-tint={block.tint}
    />
  );
}

export function HeadlineBlock({ block, theme, useCssVars, compact, layout }: BlockProps) {
  const t = pickTheme(theme, useCssVars);
  const size = block.size ?? (compact ? "md" : "lg");
  const typeStyle = HERO_SIZE_STYLES[size];
  const onOverlay = layout === "overlay";
  return (
    <h1
      style={{
        margin: 0,
        color: onOverlay ? "#fff" : t.ink,
        letterSpacing: "-.02em",
        ...typeStyle,
        ...alignStyle(block.align),
      }}
    >
      {block.text}
    </h1>
  );
}

export function AccentBlock({ block, theme, useCssVars, compact }: BlockProps) {
  const t = pickTheme(theme, useCssVars);
  const size = block.size ?? (compact ? "md" : "lg");
  const typeStyle = HERO_SIZE_STYLES[size];
  return (
    <p
      style={{
        margin: 0,
        color: t.accent,
        letterSpacing: "-.01em",
        ...typeStyle,
        ...alignStyle(block.align),
      }}
    >
      {block.text}
    </p>
  );
}

export function SubtitleBlock({ block, useCssVars, compact, layout }: BlockProps) {
  const size = block.size ?? "md";
  const typeStyle = HERO_SIZE_STYLES[size];
  const onOverlay = layout === "overlay";
  return (
    <p
      style={{
        margin: "10px 0 0",
        color: onOverlay ? "rgba(255,255,255,.82)" : useCssVars ? "var(--ink-500)" : "#4b5563",
        lineHeight: 1.5,
        ...typeStyle,
        fontWeight: 400,
        ...alignStyle(block.align),
        ...(compact
          ? {
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }
          : {}),
      }}
    >
      {block.text}
    </p>
  );
}

export function ButtonBlock({ block, theme, useCssVars, host, compact }: BlockProps) {
  const t = pickTheme(theme, useCssVars);
  const lg = !compact;
  const href = block.ctaHref ?? "/search";
  const Link = host.Link;
  return (
    <div style={{ marginTop: compact ? 10 : 24, ...alignStyle(block.align) }}>
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: t.accent,
          color: "#fff",
          fontWeight: 700,
          borderRadius: "var(--r-full, 999px)",
          padding: lg ? "0 26px" : "0 16px",
          height: lg ? 52 : 36,
          fontSize: lg ? "1.125rem" : ".875rem",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {block.ctaLabel ?? "Shop now"}
        {host.Icon ? <host.Icon name="arrowRight" size={lg ? 20 : 16} color="#fff" /> : null}
      </Link>
    </div>
  );
}

export function SponsorPillBlock({
  block: block_,
  context,
  host,
  useCssVars: _useCssVars,
}: BlockProps) {
  void block_;
  void _useCssVars;
  const label = context.campaignLabel?.trim() || "Sponsored";
  if (!context.sponsored && !context.sponsorName && !context.campaignLabel) return null;
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
        borderRadius: "var(--r-full, 999px)",
        background: "rgba(15,23,42,.78)",
        color: "#fff",
        fontSize: ".6875rem",
        fontWeight: 700,
        letterSpacing: ".03em",
        textTransform: "uppercase",
      }}
    >
      {host.Icon ? <host.Icon name="badgeCheck" size={12} color="#fff" /> : null}
      {label}
    </span>
  );
}

export function ImageBlock({ block, theme, useCssVars, host, compact, layout }: BlockProps) {
  const t = pickTheme(theme, useCssVars);
  const px = compact ? 200 : 320;
  const box = compact ? "clamp(76px, 24vw, 116px)" : 300;
  const src =
    (block.imageUrl && host.cloudinaryUrl?.(block.imageUrl, { width: px, height: px })) ||
    block.imageUrl;

  const isOverlay = layout === "overlay";

  if (isOverlay) {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: `linear-gradient(180deg, rgba(11,18,32,.55) 0%, rgba(11,18,32,.72) 100%), url(${src}) center/cover no-repeat`,
        }}
      />
    );
  }

  if (!src) {
    return (
      <div
        style={{
          width: box,
          height: box,
          borderRadius: "var(--r-xl, 20px)",
          border: "2px dashed rgba(15,23,42,.2)",
          display: "grid",
          placeItems: "center",
          color: useCssVars ? "var(--ink-400)" : "#6b7280",
          fontSize: ".75rem",
        }}
      >
        Image
      </div>
    );
  }

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
          background: `radial-gradient(circle at 50% 50%, ${t.glow}, rgba(0,0,0,0) 70%)`,
          filter: `blur(${compact ? 12 : 26}px)`,
        }}
      />
      {/* Hero art URLs are admin-configured and vary by campaign; skip next/image domain allowlist. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={block.imageAlt ?? ""}
        width={px}
        height={px}
        loading="eager"
        decoding="async"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "var(--r-xl, 20px)",
          boxShadow: `0 18px 40px ${t.shadow}`,
        }}
      />
    </div>
  );
}

export function CountdownBlock({ block, useCssVars, compact }: BlockProps) {
  const target = block.targetAt ? new Date(block.targetAt).getTime() : NaN;
  const now = Date.now();
  const diff = Number.isFinite(target) ? Math.max(0, target - now) : 0;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  if (!Number.isFinite(target)) return null;

  return (
    <div
      style={{
        marginTop: compact ? 8 : 16,
        display: "inline-flex",
        gap: compact ? 8 : 12,
        fontVariantNumeric: "tabular-nums",
        fontWeight: 700,
        fontSize: compact ? ".8125rem" : ".9375rem",
        color: useCssVars ? "var(--ink-700)" : "#1f2937",
        ...alignStyle(block.align),
      }}
      aria-live="polite"
    >
      <span>{days}d</span>
      <span>{hours}h</span>
      <span>{mins}m</span>
    </div>
  );
}

export function SpacerBlock({ block }: BlockProps) {
  const h = SPACER_HEIGHTS_PX[block.height ?? "md"];
  return <div aria-hidden style={{ height: h, flexShrink: 0 }} />;
}

export function renderBlock(
  block: HeroBlock,
  props: Omit<BlockProps, "block"> & { layout: HeroLayout },
): React.ReactNode {
  const full = { ...props, block };
  switch (block.type) {
    case "background":
      return <BackgroundBlock key={block.id} {...full} />;
    case "headline":
      return <HeadlineBlock key={block.id} {...full} />;
    case "accent":
      return <AccentBlock key={block.id} {...full} />;
    case "subtitle":
      return <SubtitleBlock key={block.id} {...full} />;
    case "button":
      return <ButtonBlock key={block.id} {...full} />;
    case "sponsor_pill":
      return <SponsorPillBlock key={block.id} {...full} />;
    case "image":
      return <ImageBlock key={block.id} {...full} />;
    case "countdown":
      return <CountdownBlock key={block.id} {...full} />;
    case "spacer":
      return <SpacerBlock key={block.id} {...full} />;
    default:
      return null;
  }
}

export function bannerThemeFromBlocks(blocks: HeroBlock[]): HeroTheme {
  const bg = blocks.find((b) => b.type === "background");
  return themeForTint((bg?.tint as HeroTint | undefined) ?? "red");
}
