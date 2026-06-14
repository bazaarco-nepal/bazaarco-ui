"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  Chip,
  Price,
  Placeholder,
  RatingStars,
  TINTS,
  DeliverToModal,
  AppLink,
} from "@/components/ui";
import { pathFromScreen } from "@/config/routes";
import { useLogout } from "@/hooks/use-auth";
import { useAddresses, useCreateAddress } from "@/hooks/use-addresses";
import { deliveryToSavePayload } from "@/lib/saved-address";
import { displayName } from "@/lib/display";
import { displayCategoryLabel, displayProductName } from "@/lib/locale-display";
import { useBazaarStore } from "@/store/bazaar-store";
import { formatDeliverToLabel } from "@/lib/delivery-location";
import { ASSETS } from "@/config/assets";
import { SOCIAL_LINKS } from "@/config/site";
import { BuyerAvatar } from "@/components/common/buyer-avatar";
import { LogoutConfirmModal } from "@/components/common/logout-confirm-modal";

import type { BazaarContextValue } from "@/types/bazaar";
import type { Category, Product, Seller } from "@/types";
import type { AuthUser } from "@/types/auth";
import type { DeliveryLocation } from "@/lib/delivery-location";

export const BazaarCtx = createContext<BazaarContextValue | null>(null);
export const useBz = (): BazaarContextValue => {
  const ctx = useContext(BazaarCtx);
  if (!ctx) {
    throw new Error("useBz must be used within BazaarProvider");
  }
  return ctx;
};

/* ---------- Himalayan outline (legacy hero accent) ---------- */
export function Himalaya({
  color = "rgba(255,255,255,.18)",
  height = 90,
  style,
}: {
  color?: string;
  height?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 1280 120"
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block", ...style }}
      aria-hidden="true"
    >
      <path
        fill={color}
        d="M0,120 L0,70 L120,42 L210,78 L330,30 L430,76 L520,18 L610,72 L700,40 L820,84 L900,48 L1010,90 L1110,52 L1190,82 L1280,58 L1280,120 Z"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="2"
        d="M0,70 L120,42 L210,78 L330,30 L430,76 L520,18 L610,72 L700,40 L820,84 L900,48 L1010,90 L1110,52 L1190,82 L1280,58"
      />
    </svg>
  );
}

/* ---------- Kathmandu valley skyline (image-based footer band) ---------- */
export function KathmanduSkyline({
  src = ASSETS.skyline,
  height = 300,
  opacity = 0.82,
  scale = 0.82,
  position = "center 60%",
  style,
}: {
  src?: string;
  height?: number;
  opacity?: number;
  scale?: number;
  position?: string;
  style?: React.CSSProperties;
}) {
  const mask =
    "linear-gradient(to bottom, transparent 0%, #000 30%, #000 88%, transparent 100%), linear-gradient(to right, transparent 0%, #000 6%, #000 94%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        height,
        display: "block",
        marginBottom: -1,
        pointerEvents: "none",
        backgroundImage: `url(${src})`,
        backgroundSize: `${scale * 100}% auto`,
        backgroundPosition: position,
        backgroundRepeat: "no-repeat",
        opacity,
        filter: "invert(1) grayscale(1) brightness(1.6) contrast(1.45)",
        mixBlendMode: "screen",
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
        ...style,
      }}
    />
  );
}

/* ---------- Seller row (PDP, cards) ---------- */
export function SellerRow({
  seller,
  sellerId,
  saved = false,
  onToggleSave,
  onVisit,
  compact = false,
}: {
  seller?: Seller | null;
  sellerId?: string;
  saved?: boolean;
  onToggleSave?: (sellerId: string) => void;
  onVisit?: (sellerId: string) => void;
  compact?: boolean;
}) {
  if (!seller) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: compact ? "8px 0" : "12px 0",
          color: "var(--ink-400)",
          fontSize: ".875rem",
        }}
      >
        <Spinner size={18} /> Loading seller…
      </div>
    );
  }

  const tint = TINTS[seller.tint ?? "slate"] ?? TINTS.slate;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: compact ? "8px 0" : "12px 0",
        width: "100%",
      }}
    >
      <div
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          borderRadius: "50%",
          overflow: "hidden",
          border: "1.5px solid var(--line-200)",
          flexShrink: 0,
          background: tint[0],
        }}
      >
        {seller.avatar ? (
          <img
            src={seller.avatar}
            alt={seller.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: tint[2],
            }}
          >
            {seller.name?.[0] ?? "?"}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: compact ? ".875rem" : ".9375rem",
              color: "var(--ink-900)",
            }}
          >
            {seller.name}
          </span>
        </div>
        <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>
          {seller.city}
          {seller.rating > 0 && (
            <span>
              {" "}
              · <span className="tnum">{seller.rating.toFixed(1)}</span>★ ({seller.reviews})
            </span>
          )}
        </div>
      </div>
      {onVisit && sellerId && (
        <Button
          variant="secondary"
          size="sm"
          icon="store"
          style={{ flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onVisit(sellerId);
          }}
        >
          Visit store
        </Button>
      )}
      {onToggleSave && sellerId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(sellerId);
          }}
          aria-label={saved ? "Unsave seller" : "Save seller"}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `1.5px solid ${saved ? "var(--red)" : "var(--line-200)"}`,
            background: saved ? "var(--tint-red-50)" : "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: saved ? "var(--red)" : "var(--ink-500)",
          }}
        >
          <Icon name="heart" size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}

/* ---------- Product card ---------- */
export function ProductCard({
  p,
  onClick,
  sale = false,
}: {
  p: Product;
  onClick: (p: Product) => void;
  sale?: boolean;
}) {
  const { toggleWish, wish } = useBz();
  const locale = useBazaarStore((s) => s.locale);
  const productName = displayProductName(p, locale);
  const [hov, setHov] = useState(false);
  const disc = p.original ? Math.round((1 - p.price / p.original) * 100) : 0;
  const wished = wish.includes(p.id);
  // Sold count as social proof — sale cards only; derived from reviews × deterministic factor
  const soldCount = Math.max(p.reviews * 3, 12);
  const soldLabel =
    soldCount >= 1000
      ? `${(soldCount / 1000).toFixed(1).replace(/\.0$/, "")}k sold`
      : `${soldCount} sold`;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        background: "#fff",
        border: `1px solid ${hov ? "var(--ink-300)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        cursor: "pointer",
        transition:
          "border-color var(--dur-standard) var(--ease), box-shadow var(--dur-standard) var(--ease)",
        boxShadow: hov ? "var(--sh-1)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Stretched link: a real <a> covering the card so the browser can open
          the product in a new tab (⌘/Ctrl/middle/right-click). Left-click runs
          the app's openProduct via onNavigate. Interactive controls below sit
          above this overlay with their own z-index. */}
      <AppLink
        href={pathFromScreen("pdp", p.id)}
        onNavigate={() => onClick(p)}
        ariaLabel={productName}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />
      <div style={{ position: "relative" }}>
        {p.img ? (
          <div
            className="bz-pcard__img"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 0.8",
              overflow: "hidden",
            }}
          >
            <img
              src={p.img}
              alt={productName}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ) : (
          <Placeholder icon={p.icon} tint={p.tint} radius="0" ratio="1 / 0.8" />
        )}
        {/* Single discount badge — only one platform-badge style allowed */}
        {disc > 0 && (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <Chip tone="red" size="sm">
              -{disc}%
            </Chip>
          </div>
        )}
        {/* wishlist — 44×44 per WCAG / Material touch target */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleWish(p.id);
          }}
          aria-label="Add to wishlist"
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            zIndex: 2,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: wished ? "var(--red)" : "var(--ink-500)",
          }}
        >
          {/* 44px tap target per WCAG; visible circle kept smaller (30px) to lighten the image */}
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,.95)",
              boxShadow: "var(--sh-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="heart" size={16} fill={wished ? "currentColor" : "none"} />
          </span>
        </button>
        {/* Video — minimal icon-only chip, no label */}
        {p.hasVideo && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(11,18,32,.72)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="play" size={13} fill="#fff" />
          </div>
        )}
        {/* Urgency only — low stock */}
        {p.lowStock && (
          <div style={{ position: "absolute", bottom: 10, right: 10 }}>
            <Chip tone="saffron" size="sm">
              Only {p.lowStock} left
            </Chip>
          </div>
        )}
      </div>
      <div
        className="bz-pcard__body"
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          flex: 1,
        }}
      >
        <div
          className="bz-pcard__title"
          style={{
            fontSize: ".875rem",
            fontWeight: 600,
            color: "var(--ink-900)",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.7em",
          }}
        >
          {productName}
        </div>
        <div
          className="bz-pcard__rating"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            minHeight: "1.25rem",
            fontSize: ".75rem",
            color: "var(--ink-500)",
          }}
        >
          <RatingStars value={p.rating ?? 0} size={12} count={p.reviews} />
          {sale && <span style={{ color: "var(--ink-400)" }}>· {soldLabel}</span>}
        </div>
        {/* Single price line: all-in price + strikethrough original — via Price primitive */}
        {/* Trust row (cash on delivery / 7-day return) and delivery ETA live on the PDP only, not on cards. */}
        {/* marginTop:auto pins price to card bottom so price rows align across the grid */}
        <div className="bz-pcard__price" style={{ marginTop: "auto" }}>
          <Price value={p.price} original={p.original} size="md" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Sale product card ---------- */
/* Inherits ProductCard; adds sold-count social proof. */
export function SaleProductCard(props: { p: Product; onClick: (p: Product) => void }) {
  return <ProductCard {...props} sale />;
}

/* ---------- Horizontal rail of cards ---------- */
export function ProductRail({
  items,
  onOpen,
  cols,
  sale = false,
}: {
  items: Product[];
  onOpen: (p: Product) => void;
  cols?: number;
  sale?: boolean;
}) {
  return (
    <div
      className="bz-grid-cards"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols || 5}, 1fr)`, gap: 18 }}
    >
      {items.map((p) => (
        <ProductCard key={p.id} p={p} onClick={onOpen} sale={sale} />
      ))}
    </div>
  );
}

/* ---------- Category tile ---------- */
// Per-category pastel tint → soft circle bg + saturated line-icon color.
// Harmonized with the BazaarCo brand palette (red primary, warm Nepali tones).
const CAT_TINTS = {
  red: { bg: "#fff1f2", fg: "#e63946" },
  blue: { bg: "#eff6ff", fg: "#1d4ed8" },
  saffron: { bg: "#fff4e5", fg: "#f77f00" },
  purple: { bg: "#f4f0ff", fg: "#7c3aed" },
  slate: { bg: "#f1f5f9", fg: "#475569" },
  green: { bg: "#ecfdf5", fg: "#059669" },
  gold: { bg: "#fdf5e1", fg: "#c08a00" },
  teal: { bg: "#e9fbf7", fg: "#0d9488" },
};

// Canonical category icons, keyed by category id. Overrides whatever icon the
// backend serves so the storefront stays correct without a re-seed. Keep in
// sync with the backend taxonomy in
// bazaarco-api/src/infrastructure/database/seeds/catalog-data.ts.
const CATEGORY_ICON: Record<string, string> = {
  "mobile-phones-tablets": "phone",
  "electronics-gadgets": "headphones",
  "computers-accessories": "file",
  "fashion-clothing": "shirt",
  "shoes-footwear": "shirt",
  "bags-watches-accessories": "tag",
  "beauty-cosmetics": "lipstick",
  "health-wellness": "leaf",
  "groceries-essentials": "basket",
  "kitchenware-dining": "home",
  "home-appliances": "home",
  "home-decor": "home",
  furniture: "home",
  "baby-kids-toys": "pacifier",
  "sports-fitness-outdoors": "football",
  "automotive-motorbike": "truck",
  "books-stationery": "book",
  "musical-instruments": "headphones",
  "pet-supplies": "leaf",
  "local-nepali-handmade": "temple",
  // Legacy seed category IDs (production DB)
  electronics: "headphones",
  fashion: "shirt",
  "health-beauty": "leaf",
  "home-living": "home",
  "mother-baby-kids": "pacifier",
  "sports-outdoors": "football",
  automotive: "truck",
  "crafts-heritage": "temple",
  "digital-goods-services": "file",
  "tools-home-improvement": "home",
  "medical-office-supplies": "leaf",
};

// Colorful real-object category artwork served from public/category-icons. Keyed
// by category id; when present we render the SVG, otherwise we fall back to the
// line Icon above. Filenames mirror public/category-icons/manifest.json.
const CATEGORY_ICON_SRC: Record<string, string> = {
  "mobile-phones-tablets": "/category-icons/01-mobile-phones-tablets.svg",
  "electronics-gadgets": "/category-icons/02-electronics-gadgets.svg",
  "computers-accessories": "/category-icons/03-computers-accessories.svg",
  "fashion-clothing": "/category-icons/04-fashion-clothing.svg",
  "shoes-footwear": "/category-icons/05-shoes-footwear.svg",
  "bags-watches-accessories": "/category-icons/06-bags-watches-accessories.svg",
  "beauty-cosmetics": "/category-icons/07-beauty-cosmetics.svg",
  "health-wellness": "/category-icons/08-health-wellness.svg",
  "groceries-essentials": "/category-icons/09-groceries-essentials.svg",
  "kitchenware-dining": "/category-icons/10-kitchenware-dining.svg",
  "home-appliances": "/category-icons/11-home-appliances.svg",
  "home-decor": "/category-icons/12-home-decor.svg",
  furniture: "/category-icons/13-furniture.svg",
  "baby-kids-toys": "/category-icons/14-baby-kids-toys.svg",
  "sports-fitness-outdoors": "/category-icons/15-sports-fitness-outdoors.svg",
  "automotive-motorbike": "/category-icons/16-automotive-motorbike.svg",
  "books-stationery": "/category-icons/17-books-stationery.svg",
  "musical-instruments": "/category-icons/18-musical-instruments.svg",
  "pet-supplies": "/category-icons/19-pet-supplies.svg",
  "local-nepali-handmade": "/category-icons/20-local-nepali-handmade.svg",
  // Legacy seed category IDs — reuse the closest matching artwork
  electronics: "/category-icons/02-electronics-gadgets.svg",
  fashion: "/category-icons/04-fashion-clothing.svg",
  "health-beauty": "/category-icons/08-health-wellness.svg",
  "home-living": "/category-icons/12-home-decor.svg",
  "mother-baby-kids": "/category-icons/14-baby-kids-toys.svg",
  "sports-outdoors": "/category-icons/15-sports-fitness-outdoors.svg",
  automotive: "/category-icons/16-automotive-motorbike.svg",
  "crafts-heritage": "/category-icons/20-local-nepali-handmade.svg",
  "digital-goods-services": "/category-icons/03-computers-accessories.svg",
};

// Shorter labels used only on the mobile homepage grid (the first 6 tiles), where
// full taxonomy names wrap and look congested. Desktop and the "All categories"
// view always use the full name. Only ids present here get a short form.
const CATEGORY_SHORT_NAME: Record<string, string> = {
  "mobile-phones-tablets": "Mobile Phones",
  "electronics-gadgets": "Electronics",
  "computers-accessories": "Computers",
  "fashion-clothing": "Fashion",
  "shoes-footwear": "Footwear",
  "bags-watches-accessories": "Accessories",
};

// `compact` is kept for call-site compatibility, but category labels always use
// the exact taxonomy name so buyer views do not drift from the catalog.
export function CategoryTile({
  c,
  onClick,
  compact = false,
  href,
  shortOnMobile = false,
}: {
  c: Category;
  onClick: (c: Category) => void;
  compact?: boolean;
  href?: string;
  shortOnMobile?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const locale = useBazaarStore((s) => s.locale);
  const tint = CAT_TINTS[c.tint] ?? CAT_TINTS.red;
  const label = displayCategoryLabel(c, locale);
  const shortLabel = shortOnMobile ? CATEGORY_SHORT_NAME[c.id] : undefined;
  const iconName = CATEGORY_ICON[c.id] ?? "tag";
  const iconSrc = CATEGORY_ICON_SRC[c.id];
  const Tag: React.ElementType = href ? AppLink : "button";
  const tagProps = href ? { href, onNavigate: () => onClick(c) } : { onClick: () => onClick(c) };
  return (
    <Tag
      {...tagProps}
      className={`bz-cat__tile${compact ? " bz-cat__tile--compact" : ""}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 0,
        width: "100%",
        textDecoration: "none",
      }}
    >
      <div
        className="bz-cat__circle"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: tint.bg,
          boxShadow: hov ? "var(--sh-2)" : "var(--sh-1)",
          transform: hov ? "translateY(-2px)" : "translateY(0)",
          transition: "all var(--dur-standard) var(--ease)",
        }}
      >
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              width: "84%",
              height: "84%",
              objectFit: "contain",
              display: "block",
              transform: hov ? "scale(1.06)" : "scale(1)",
              transition: "transform var(--dur-standard) var(--ease)",
            }}
          />
        ) : (
          <Icon name={iconName} size={27} color={tint.fg} stroke={1.8} />
        )}
      </div>
      <div style={{ textAlign: "center", lineHeight: 1.2 }}>
        <div className="bz-cat__en" style={{ fontSize: ".8125rem", fontWeight: 600 }}>
          {shortLabel ? (
            <>
              <span className="bz-hide-mobile">{label}</span>
              <span className="bz-show-mobile">{shortLabel}</span>
            </>
          ) : (
            label
          )}
        </div>
      </div>
    </Tag>
  );
}

/* ---------- Navbar ---------- */
export function DevViewSwitcher() {
  const { screen } = useBz();
  const SELLER = [
    "s-onboarding",
    "s-dashboard",
    "s-inbox",
    "s-order-detail",
    "s-add",
    "s-products",
    "s-ledger",
  ];
  const isSeller = SELLER.includes(screen);
  const target = isSeller ? "home" : "s-dashboard";
  const icon = isSeller ? "cart" : "store";
  const label = isSeller ? "Switch to buyer view" : "Switch to seller view";
  return (
    <AppLink
      href={pathFromScreen(target)}
      title={label}
      ariaLabel={label}
      style={{
        position: "fixed",
        left: 22,
        bottom: 22,
        zIndex: 200,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "var(--blue-deep)",
        color: "#fff",
        border: "3px solid #fff",
        boxShadow: "0 6px 20px rgba(11,18,32,.22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <Icon name={icon} size={26} color="#fff" />
    </AppLink>
  );
}

export function NavMenuItem({
  icon,
  label,
  danger,
  onClick,
  href,
  onNavigate,
}: {
  icon: string;
  label: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  href?: string;
  onNavigate?: () => void;
}) {
  const [hov, setHov] = useState(false);
  const color = danger ? "var(--red)" : "var(--ink-700)";
  const Tag: React.ElementType = href ? AppLink : "button";
  const tagProps = href ? { href, onNavigate } : { onClick };
  return (
    <Tag
      {...tagProps}
      role="menuitem"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "9px 12px",
        border: "none",
        background: hov ? "var(--line-100)" : "transparent",
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        textAlign: "left",
        color,
        fontSize: ".875rem",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      <Icon name={icon} size={18} color={color} />
      <span>{label}</span>
    </Tag>
  );
}

function AccountMenuPanel({
  navLabel,
  user,
  authed,
  goAndClose,
  onLogout,
}: {
  navLabel: React.ReactNode;
  user: AuthUser | null;
  authed: boolean;
  goAndClose: (screen: string) => void;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <AppLink
        href={pathFromScreen("profile")}
        onNavigate={() => goAndClose("profile")}
        role="menuitem"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-md)",
          background: "var(--line-100)",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          marginBottom: 6,
          textDecoration: "none",
        }}
      >
        <BuyerAvatar user={user} size={32} fontSize={13} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: ".875rem",
              fontWeight: 700,
              color: "var(--ink-900)",
            }}
          >
            {navLabel}
          </span>
          <span
            style={{
              display: "block",
              fontSize: ".75rem",
              color: "var(--blue)",
              fontWeight: 600,
            }}
          >
            {t("nav.viewProfile")}
          </span>
        </span>
      </AppLink>
      <NavMenuItem
        icon="store"
        label={t("nav.stores")}
        href={pathFromScreen("stores")}
        onNavigate={() => goAndClose("stores")}
      />
      <NavMenuItem
        icon="package"
        label={t("nav.myOrders")}
        href={pathFromScreen("orders")}
        onNavigate={() => goAndClose("orders")}
      />
      <NavMenuItem
        icon="heart"
        label={t("nav.wishlist")}
        href={pathFromScreen("wishlist")}
        onNavigate={() => goAndClose("wishlist")}
      />
      <NavMenuItem
        icon="video"
        label={t("nav.watch")}
        href={pathFromScreen("video")}
        onNavigate={() => goAndClose("video")}
      />
      <NavMenuItem
        icon="bargain"
        label={t("nav.bargains")}
        href={pathFromScreen("bargains")}
        onNavigate={() => goAndClose("bargains")}
      />
      <div style={{ height: 1, background: "var(--line-200)", margin: "6px 4px" }} />
      {authed ? (
        <NavMenuItem icon="x" label={t("nav.logOut")} danger onClick={onLogout} />
      ) : (
        <NavMenuItem
          icon="user"
          label={t("nav.signIn")}
          href={pathFromScreen("auth")}
          onNavigate={() => goAndClose("auth")}
        />
      )}
    </>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const {
    nav,
    cartCount,
    wish,
    wishSellers,
    screen,
    query,
    setQuery,
    submitSearch,
    clearSearch,
    toast,
  } = useBz();
  const user = useBazaarStore((s) => s.user);
  const authed = useBazaarStore((s) => s.authed);
  const logoutMutation = useLogout();
  const navLabel = displayName(user, "Account");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const deliveryLocation = useBazaarStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useBazaarStore((s) => s.setDeliveryLocation);
  const deliverLabel = formatDeliverToLabel(deliveryLocation);
  const { data: savedAddresses = [] } = useAddresses(authed);
  const createAddress = useCreateAddress();
  // Only offer the navbar "Deliver to" picker while the buyer has no saved
  // address yet. Once one exists, the profile is the source of truth.
  const hasSavedAddress = savedAddresses.length > 0;
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileSheetRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (desktopMenuRef.current?.contains(t) || mobileSheetRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const goAndClose = (s: string) => {
    setMenuOpen(false);
    nav(s);
  };

  // Logout is always confirmed: close the account menu/sheet, then open the
  // shared confirmation modal. Signing out only happens once the user confirms.
  const [confirmLogout, setConfirmLogout] = useState(false);
  const requestLogout = () => {
    setMenuOpen(false);
    setConfirmLogout(true);
  };
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmLogout(false);
        nav("home");
      },
    });
  };

  return (
    <header className={`bz-navbar${screen === "home" ? " bz-hide-mobile" : ""}`}>
      <div className="bz-navbar__trust bz-hide-mobile">
        <div className="bz-navbar__trust-inner">
          {/* suppressHydrationWarning: text is locale-sensitive; server may render
              "en" on first visit before the locale cookie is set, while the client
              immediately uses the stored locale. The cookie approach eliminates this
              after the first visit; the prop silences the warning on that first load. */}
          <span
            suppressHydrationWarning
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <Icon name="bargain" size={13} color="#fff" /> {t("trust.bargain")}
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="check" size={13} color="#fff" /> {t("trust.verified")}
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="returns" size={13} color="#fff" /> {t("trust.returns")}
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="lock" size={13} color="#fff" /> {t("trust.payments")}
          </span>
        </div>
      </div>

      <div className="bz-navbar__inner">
        <AppLink
          href={pathFromScreen("home")}
          ariaLabel={t("nav.homeAria")}
          className="bz-navbar__brand bz-hide-mobile"
        >
          <Logo height={38} />
        </AppLink>

        {/* Mobile-only: buyer's profile picture replaces the logo and links to the profile page */}
        <AppLink
          href={pathFromScreen("profile")}
          ariaLabel={t("nav.profileAria")}
          className="bz-navbar__brand bz-show-mobile"
        >
          <BuyerAvatar user={user} size={40} fontSize={16} />
        </AppLink>

        {!hasSavedAddress && (
          <>
            <button
              type="button"
              onClick={() => setDeliverOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={deliverOpen}
              aria-label={`Deliver to ${deliverLabel}`}
              className="bz-navbar__deliver bz-hide-mobile"
            >
              <Icon name="mapPin" size={16} color="var(--red)" />
              <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                <div
                  style={{
                    fontSize: ".625rem",
                    color: "var(--ink-400)",
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("nav.deliverTo")}
                </div>
                <div>{deliverLabel}</div>
              </div>
              <Icon name="chevronDown" size={14} color="var(--ink-500)" />
            </button>

            <DeliverToModal
              open={deliverOpen}
              value={deliveryLocation}
              onClose={() => setDeliverOpen(false)}
              onSave={async (loc: DeliveryLocation) => {
                setDeliveryLocation(loc);
                setDeliverOpen(false);
                toast(t("delivery.deliveringTo", { label: formatDeliverToLabel(loc) }));
                // Mirror checkout: persist the entered address to the buyer's
                // profile so it becomes their (first, default) saved address.
                if (authed) {
                  try {
                    await createAddress.mutateAsync(deliveryToSavePayload(loc, "Home", true));
                  } catch {
                    /* local delivery location already set; ignore sync error */
                  }
                }
              }}
            />
          </>
        )}

        <div className="bz-navbar__search">
          <button
            type="button"
            aria-label={t("nav.search")}
            onClick={submitSearch}
            className="bz-navbar__search-btn"
          >
            <Icon name="search" size={19} />
          </button>
          <input
            ref={searchInputRef}
            className={`bz-navbar__search-input${query ? " has-clear" : ""}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            placeholder={t("nav.search")}
            aria-label={t("nav.searchProducts")}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              className="bz-navbar__search-clear"
              onClick={() => {
                clearSearch();
                searchInputRef.current?.focus();
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        <div className="bz-navbar__mobile-actions">
          <IconButton
            name="cart"
            label={t("nav.cart")}
            badge={cartCount}
            href={pathFromScreen("cart")}
            size={40}
          />
        </div>

        <nav className="bz-navbar__nav bz-navbar__nav--desktop">
          <AppLink
            href={pathFromScreen("stores")}
            className={`bz-navbar__link${screen === "stores" ? " is-active" : ""}`}
          >
            <Icon name="store" size={19} /> {t("nav.stores")}
          </AppLink>
          <AppLink
            href={pathFromScreen("video")}
            className={`bz-navbar__link bz-navbar__link--video${screen === "video" ? " is-active" : ""}`}
          >
            <Icon name="video" size={19} /> {t("nav.watch")}
          </AppLink>
          <IconButton
            name="heart"
            label={t("nav.wishlist")}
            badge={wish.length + wishSellers.length}
            href={pathFromScreen("wishlist")}
          />
          <AppLink
            href={pathFromScreen("bargains")}
            ariaLabel={t("nav.bargain")}
            title={t("nav.bargain")}
            className="bz-navbar__link bz-navbar__link--bargain"
          >
            <Icon name="bargain" size={19} color="#fff" /> {t("nav.bargain")}
          </AppLink>
          <IconButton
            name="cart"
            label={t("nav.cart")}
            badge={cartCount}
            href={pathFromScreen("cart")}
          />
          <div ref={desktopMenuRef} className="bz-navbar__account-wrap">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`bz-navbar__account-btn${menuOpen ? " is-open" : ""}`}
            >
              <BuyerAvatar user={user} size={26} fontSize={12} />
              <span
                className="bz-hide-mobile"
                style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}
              >
                {navLabel}
              </span>
              <Icon name="chevronDown" size={14} color="var(--ink-500)" />
            </button>
            {menuOpen && (
              <div role="menu" className="bz-navbar__menu bz-hide-mobile">
                <AccountMenuPanel
                  navLabel={navLabel}
                  user={user}
                  authed={authed}
                  goAndClose={goAndClose}
                  onLogout={requestLogout}
                />
              </div>
            )}
          </div>
        </nav>
      </div>

      {menuOpen && (
        <>
          <div
            className="bz-navbar__overlay bz-show-mobile"
            aria-hidden
            onClick={() => setMenuOpen(false)}
          />
          <div
            ref={mobileSheetRef}
            className="bz-navbar__sheet bz-show-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
          >
            <div className="bz-navbar__sheet-head">
              <h2 className="bz-navbar__sheet-title">{t("nav.menu")}</h2>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--line-100)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div role="menu">
              <AccountMenuPanel
                navLabel={navLabel}
                user={user}
                authed={authed}
                goAndClose={goAndClose}
                onLogout={requestLogout}
              />
            </div>
          </div>
        </>
      )}

      {/* Shared logout confirmation — every logout entry point opens this. */}
      <LogoutConfirmModal
        open={confirmLogout}
        pending={logoutMutation.isPending}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </header>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  const { t } = useTranslation();
  const legalPath = (slug: string) => `/legal/${slug}`;
  const cols: { h: string; links: { label: string; href: string }[] }[] = [
    {
      h: "BazaarCo",
      links: [
        { label: t("footer.aboutBazaarco"), href: pathFromScreen("about") },
        { label: t("footer.howItWorks"), href: pathFromScreen("how-it-works") },
        { label: t("footer.contactUs"), href: pathFromScreen("contact") },
        { label: t("footer.partnerWithUs"), href: pathFromScreen("auth") },
        { label: t("footer.legalInformation"), href: legalPath("legal-information") },
      ],
    },
    {
      h: t("footer.colBuyers"),
      links: [
        { label: t("footer.howToOrder"), href: pathFromScreen("how-to-order") },
        { label: t("footer.bargainingGuide"), href: pathFromScreen("bargaining-guide") },
        { label: t("footer.deliveryShipping"), href: legalPath("shipping-and-delivery-policy") },
        { label: t("footer.returnRefundCancel"), href: legalPath("return-and-refund-policy") },
        { label: t("footer.buyerProtection"), href: legalPath("buyer-protection-policy") },
        {
          label: t("footer.warrantyAuthenticity"),
          href: legalPath("warranty-and-authenticity-policy"),
        },
        { label: t("footer.complaintDispute"), href: legalPath("grievance-redressal-policy") },
      ],
    },
    {
      h: t("footer.colSellers"),
      links: [
        { label: t("footer.becomeSeller"), href: pathFromScreen("auth") },
        { label: t("footer.sellerPolicy"), href: legalPath("seller-policy") },
        { label: t("footer.sellerAgreement"), href: legalPath("seller-agreement") },
        { label: t("footer.commissionFees"), href: legalPath("commission-information") },
        { label: t("footer.sellerPayout"), href: legalPath("seller-payout-and-settlement-policy") },
        { label: t("footer.productListingRules"), href: legalPath("product-listing-rules") },
        {
          label: t("footer.sellerDeliveryPickup"),
          href: legalPath("seller-delivery-and-pickup-policy"),
        },
      ],
    },
    {
      h: t("footer.colLegal"),
      links: [
        { label: t("footer.termsConditions"), href: legalPath("terms-and-conditions") },
        { label: t("footer.privacyPolicy"), href: legalPath("privacy-policy") },
        { label: t("footer.paymentPolicy"), href: legalPath("payment-policy") },
        { label: t("footer.prohibitedProducts"), href: legalPath("prohibited-products-policy") },
        { label: t("footer.reviewRatingFeedback"), href: legalPath("reviews-and-guidelines") },
        { label: t("footer.communityGuidelines"), href: legalPath("community-guidelines") },
        {
          label: t("footer.intellectualProperty"),
          href: legalPath("intellectual-property-policy"),
        },
        { label: t("footer.cookiePolicy"), href: legalPath("cookie-tracking-notice") },
      ],
    },
  ];
  return (
    <footer
      style={{
        position: "relative",
        background: "var(--blue-deep)",
        color: "#fff",
        marginTop: 64,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Nepal landmark backdrop — decorative, behind the main link columns only */}
      <div
        aria-hidden="true"
        className="bz-footer-skyline"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 360,
          backgroundImage: `url(${ASSETS.skyline})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center -30px",
          backgroundSize: "75% auto",
          filter: "invert(1) grayscale(1) brightness(1.6) contrast(1.45)",
          mixBlendMode: "screen",
          opacity: 0.1,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 82%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        className="bz-footer-grid"
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "72px clamp(12px, 4vw, 28px) 48px",
          display: "grid",
          gridTemplateColumns: "1.6fr repeat(4, 1fr)",
          gap: 40,
        }}
      >
        <div>
          <Logo height={34} mono />
          <p
            className="bz-footer-tagline"
            style={{
              color: "rgba(255,255,255,.6)",
              fontSize: ".9375rem",
              lineHeight: 1.6,
              marginTop: 16,
              maxWidth: 260,
            }}
          >
            {t("footer.brandTagline")}
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
            }}
          >
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="bz-footer-social"
            >
              <Icon name="instagram" size={18} />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="bz-footer-social"
            >
              <Icon name="tiktok" size={18} fill="currentColor" />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="bz-footer-social"
            >
              <Icon name="facebook" size={18} />
            </a>
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="bz-footer-social"
            >
              <Icon name="linkedin" size={18} />
            </a>
          </div>
        </div>
        {cols.map((col, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: ".75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                marginBottom: 16,
                color: "rgba(255,255,255,.85)",
              }}
            >
              {col.h}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.8 }}>
              {col.links.map((link) => (
                <AppLink key={link.label} href={link.href} className="bz-footer-link">
                  {link.label}
                </AppLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Company details strip — quieter registered-company & grievance disclosure (E-Commerce Act 2081) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          borderTop: "1px solid rgba(255,255,255,.1)",
          background: "rgba(0,0,0,.14)",
        }}
      >
        <div
          className="bz-row-4up"
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "28px clamp(12px, 4vw, 28px)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            color: "rgba(255,255,255,.45)",
            fontSize: ".75rem",
            lineHeight: 1.7,
          }}
        >
          <div>
            <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 600, marginBottom: 4 }}>
              BazaarCo Nepal Pvt. Ltd.
            </div>
            <div>{t("footer.companyTagline")}</div>
          </div>
          <div>
            <div>{t("footer.support")}: +977 9700053075</div>
            <div>
              {t("footer.email")}:{" "}
              <a
                href="mailto:support@bazaarconepal.com"
                className="bz-footer-link"
                style={{ fontSize: ".75rem" }}
              >
                support@bazaarconepal.com
              </a>
            </div>
          </div>
          <div>
            <div>
              {t("footer.grievanceContact")}:{" "}
              <a
                href="mailto:support@bazaarconepal.com"
                className="bz-footer-link"
                style={{ fontSize: ".75rem" }}
              >
                support@bazaarconepal.com
              </a>
            </div>
            <div>
              {t("footer.portalListingNo")}: {t("footer.toBePublished")}
            </div>
          </div>
          <div>
            <div>
              {t("footer.panVat")}: {t("footer.toBePublished")}
            </div>
            <div>
              {t("footer.companyRegNo")}: {t("footer.toBePublished")}
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 28px",
            textAlign: "center",
          }}
        >
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: ".8125rem" }}>
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
}
