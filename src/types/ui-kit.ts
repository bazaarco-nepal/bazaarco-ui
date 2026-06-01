import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import type { Product, Tint } from "@/types/catalog";
import type { BazaarToast } from "@/types/bazaar";

export interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  fill?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export interface LogoProps {
  height?: number;
  mono?: boolean;
}

export interface ButtonProps {
  variant?: string;
  size?: string;
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconRight?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  style?: CSSProperties;
  className?: string;
}

export interface BottomNavProps {
  active: string | null;
  onNav: (screen: string) => void;
  seller?: boolean;
}

export interface HelpLifelineProps {
  hide?: boolean;
}

export interface ToastProps {
  toast: BazaarToast | null;
}

export interface ProductCardProps {
  p: Product;
  onClick: (product: Product) => void;
  /** Sale card variant — shows sold-count social proof. Omit for regular cards. */
  sale?: boolean;
}

export interface PdpProps {
  p: Product;
}

export interface KathmanduSkylineProps {
  src?: string;
  height?: number;
  opacity?: number;
  scale?: number;
  position?: string;
  style?: CSSProperties;
}

export type TintMap = Record<Tint, [string, string, string]>;
