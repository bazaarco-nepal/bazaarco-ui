import type { CSSProperties, ReactNode } from "react";
import type { HeroAlign } from "../types";

export type HeroBannerHost = {
  Link: (props: {
    href: string;
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
  }) => ReactNode;
  Icon?: (props: { name: string; size: number; color?: string }) => ReactNode;
  cloudinaryUrl?: (url: string, opts: { width: number; height: number }) => string | undefined;
};

export function alignStyle(align: HeroAlign | undefined): CSSProperties {
  switch (align) {
    case "center":
      return { textAlign: "center", alignItems: "center" };
    case "right":
      return { textAlign: "right", alignItems: "flex-end" };
    default:
      return { textAlign: "left", alignItems: "flex-start" };
  }
}
