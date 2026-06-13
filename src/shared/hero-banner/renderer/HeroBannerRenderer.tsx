"use client";

import type { CSSProperties } from "react";
import type { HeroBannerContext, HeroBannerContent, HeroBlock } from "../types";
import { bannerThemeFromBlocks, renderBlock } from "./blocks";
import type { HeroBannerHost } from "./host";

export type HeroBannerRendererProps = {
  content: HeroBannerContent;
  context?: HeroBannerContext;
  host: HeroBannerHost;
  /** When true, uses buyer-app CSS variables; admin preview passes false. */
  useCssVars?: boolean;
  /** desktop = full split layout; mobile = compact band */
  device?: "desktop" | "mobile";
  className?: string;
  style?: CSSProperties;
};

const TEXT_TYPES = new Set<HeroBlock["type"]>([
  "headline",
  "accent",
  "subtitle",
  "button",
  "countdown",
  "spacer",
  "sponsor_pill",
]);

function partitionBlocks(content: HeroBannerContent) {
  const chrome: HeroBlock[] = [];
  const text: HeroBlock[] = [];
  let image: HeroBlock | undefined;

  for (const block of content.blocks) {
    if (block.type === "background" || block.type === "sponsor_pill") {
      chrome.push(block);
    } else if (block.type === "image") {
      if (!image) image = block;
    } else if (TEXT_TYPES.has(block.type)) {
      text.push(block);
    }
  }

  return { chrome, text, image };
}

function gridForLayout(layout: HeroBannerContent["layout"], compact: boolean): CSSProperties {
  if (compact) {
    return {
      display: "flex",
      alignItems: "center",
      minHeight: "clamp(112px, 30vw, 148px)",
    };
  }

  switch (layout) {
    case "image_left":
      return {
        display: "grid",
        gridTemplateColumns: "minmax(240px, 1fr) minmax(0, 1.1fr)",
        alignItems: "center",
        minHeight: 360,
      };
    case "image_right":
      return {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(240px, 1fr)",
        alignItems: "center",
        minHeight: 360,
      };
    case "image_above":
      return {
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 24,
        minHeight: 360,
      };
    case "image_below":
      return {
        display: "grid",
        gridTemplateRows: "1fr auto",
        gap: 24,
        minHeight: 360,
      };
    case "overlay":
      return {
        display: "grid",
        placeItems: "center",
        minHeight: 360,
        textAlign: "center",
      };
    case "text_only":
    default:
      return {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 280,
      };
  }
}

function imageFirst(layout: HeroBannerContent["layout"]): boolean {
  return layout === "image_left" || layout === "image_above";
}

function showImageZone(layout: HeroBannerContent["layout"], image?: HeroBlock): boolean {
  if (!image) return false;
  return layout !== "text_only";
}

export function HeroBannerRenderer({
  content,
  context = {},
  host,
  useCssVars = true,
  device = "desktop",
  className,
  style,
}: HeroBannerRendererProps) {
  const compact = device === "mobile";
  const theme = bannerThemeFromBlocks(content.blocks);
  const { chrome, text, image } = partitionBlocks(content);
  const shared = { theme, useCssVars, host, context, compact, layout: content.layout };

  const shellStyle: CSSProperties = {
    position: "relative",
    borderRadius: "var(--r-xl, 20px)",
    overflow: "hidden",
    ...gridForLayout(content.layout, compact),
    ...style,
  };

  const textColStyle: CSSProperties = compact
    ? {
        flex: 1,
        minWidth: 0,
        padding: "clamp(14px, 4vw, 20px) 0 clamp(14px, 4vw, 20px) clamp(16px, 4.5vw, 22px)",
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }
    : {
        position: "relative",
        zIndex: 2,
        padding: content.layout === "overlay" ? "48px 32px" : "56px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        maxWidth: content.layout === "overlay" ? 560 : undefined,
      };

  const imageColStyle: CSSProperties = compact
    ? { flexShrink: 0, padding: "0 clamp(14px, 4vw, 20px)", position: "relative", zIndex: 2 }
    : {
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 56px",
      };

  const textColumn = (
    <div style={textColStyle}>{text.map((block) => renderBlock(block, shared))}</div>
  );

  const imageColumn =
    showImageZone(content.layout, image) && image ? (
      <div style={imageColStyle}>{renderBlock(image, shared)}</div>
    ) : null;

  const ordered =
    content.layout === "overlay" ? (
      <>
        {image && renderBlock(image, shared)}
        <div style={{ ...textColStyle, color: "#fff", zIndex: 2 }}>
          {text.map((b) => renderBlock(b, { ...shared, useCssVars: false }))}
        </div>
      </>
    ) : imageFirst(content.layout) ? (
      <>
        {imageColumn}
        {textColumn}
      </>
    ) : content.layout === "image_below" ? (
      <>
        {textColumn}
        {imageColumn}
      </>
    ) : content.layout === "image_above" ? (
      <>
        {imageColumn}
        {textColumn}
      </>
    ) : content.layout === "text_only" ? (
      textColumn
    ) : (
      <>
        {textColumn}
        {imageColumn}
      </>
    );

  return (
    <div className={className} style={shellStyle} role="article">
      {chrome.map((block) => renderBlock(block, shared))}
      {ordered}
    </div>
  );
}
