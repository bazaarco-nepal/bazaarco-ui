"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  Badge,
  Price,
  Placeholder,
  RatingStars,
  StoreAvatar,
  DeliverToModal,
  AppLink,
} from "@/components/ui";
import { useSearchParams } from "next/navigation";
import {
  browsePath,
  categoryIdsFromSearchParams,
  pathFromScreen,
  sellerSignupPath,
} from "@/config/routes";
import { categoryImageBySlug } from "@/config/category-images";
import { useLogout } from "@/shared/hooks/use-auth";
import { useCategories } from "@/shared/hooks/use-catalog";
import { formatNPR } from "@/shared/lib/money";
import { useAddresses, useCreateAddress } from "@/buyer/hooks/use-addresses";
import { deliveryToSavePayload } from "@/buyer/lib/saved-address";
import { displayName, firstName } from "@/shared/lib/display";
import { displayCategoryLabel, displayProductName } from "@/shared/lib/locale-display";
import { useBazaarStore } from "@/store/bazaar-store";
import { formatDeliverToLabel } from "@/shared/lib/delivery-location";
import { toast } from "@/shared/lib/toast";
import { ASSETS } from "@/config/assets";
import { SOCIAL_LINKS } from "@/config/site";
import { BuyerAvatar } from "@/components/common/buyer-avatar";
import { LogoutConfirmModal } from "@/components/common/logout-confirm-modal";
import { LanguageToggle } from "@/components/common/language-toggle";

import type { BazaarContextValue } from "@/types/bazaar";
import type { Category, Product, Seller } from "@/types";
import type { AuthUser } from "@/types/auth";
import type { DeliveryLocation } from "@/shared/lib/delivery-location";

export const BazaarCtx = createContext<BazaarContextValue | null>(null);
export const useBz = (): BazaarContextValue => {
  const ctx = useContext(BazaarCtx);
  if (!ctx) {
    throw new Error("useBz must be used within BazaarProvider");
  }
  return ctx;
};

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
  const { t } = useTranslation();
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
        <Spinner size={18} /> {t("common.loadingSeller")}
      </div>
    );
  }

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
      <StoreAvatar src={seller.avatar} name={seller.name} size={compact ? 40 : 48} />
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
          {t("common.visitStore")}
        </Button>
      )}
      {onToggleSave && sellerId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(sellerId);
          }}
          aria-label={saved ? t("common.a11y.unsaveSeller") : t("common.a11y.saveSeller")}
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
// A discount shows the struck original price always, but the green "Save Rs. N"
// line only once the saving clears this floor (rupees) — below it a trivial
// "Save Rs. 17" just adds noise.
const SAVINGS_THRESHOLD = 50;

export function ProductCard({
  p,
  onClick,
  preview = false,
  savable = true,
  ctaLabel,
  ctaIcon,
  onCta,
}: {
  p: Product;
  onClick: (p: Product) => void;
  /** Static, non-interactive render (no PDP link, no save toggle) — used by
      the Add Product live preview so sellers see the exact buyer card. */
  preview?: boolean;
  savable?: boolean;
  ctaLabel?: string;
  ctaIcon?: React.ComponentProps<typeof Icon>["name"];
  onCta?: (p: Product) => void;
}) {
  const { t } = useTranslation();
  const { toggleSaved, savedProducts } = useBz();
  const locale = useBazaarStore((s) => s.locale);
  const productName = displayProductName(p, locale);
  const [hov, setHov] = useState(false);
  const isSaved = savable && savedProducts.includes(p.id);
  const reviewCount = p.reviews ?? 0;
  const hasReviews = reviewCount > 0;
  const savings = p.original ? p.original - p.price : 0;
  const discountPct =
    p.original && p.original > p.price
      ? Math.round(((p.original - p.price) / p.original) * 100)
      : 0;
  return (
    <div
      className="bz-product-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        background: "#fff",
        border: `1px solid ${hov ? "var(--ink-300)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        cursor: preview ? "default" : "pointer",
        transition:
          "border-color var(--dur-standard) var(--ease), box-shadow var(--dur-standard) var(--ease)",
        boxShadow: hov ? "var(--sh-1)" : "none",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* Stretched link: a real <a> covering the card so the browser can open
          the product in a new tab (⌘/Ctrl/middle/right-click). Left-click runs
          the app's openProduct via onNavigate. Interactive controls below sit
          above this overlay with their own z-index. Omitted in preview mode —
          there's no live product to open yet. */}
      {!preview && (
        <AppLink
          href={pathFromScreen("pdp", p.id)}
          onNavigate={() => onClick(p)}
          ariaLabel={productName}
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        />
      )}
      <div style={{ position: "relative" }}>
        {p.img ? (
          <div
            className="bz-pcard__img"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              overflow: "hidden",
            }}
          >
            <img
              src={p.img}
              alt={productName}
              className="bz-pcard__img-el"
              style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
            />
          </div>
        ) : (
          <Placeholder icon={p.icon} radius="0" ratio="1 / 1" />
        )}
        {/* Discount % — solid-green badge (matches the "Save Rs." pill), top-left.
            aria-hidden: the struck price + "Save Rs." chip already announce the
            discount, so this is visual reinforcement only. */}
        {discountPct >= 1 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 2,
              background: "var(--success)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1,
              padding: "3px 7px",
              borderRadius: 7,
            }}
          >
            -{discountPct}%
          </span>
        )}
        {/* save — 44×44 per WCAG / Material touch target */}
        {savable && (
          <button
            onClick={
              preview
                ? undefined
                : (e) => {
                    e.stopPropagation();
                    void toggleSaved(p.id, productName);
                  }
            }
            aria-label={t("common.a11y.save")}
            aria-hidden={preview || undefined}
            tabIndex={preview ? -1 : undefined}
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
              cursor: preview ? "default" : "pointer",
              pointerEvents: preview ? "none" : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isSaved ? "var(--red)" : "var(--ink-500)",
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
              <Icon name="heart" size={16} fill={isSaved ? "currentColor" : "none"} />
            </span>
          </button>
        )}
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
      </div>
      <div
        className="bz-pcard__body"
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          flex: 1,
          minWidth: 0,
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
        {/* Rating row is ALWAYS rendered so cards keep equal height in a grid.
            Zero reviews shows an outline star + "No reviews yet" (house pattern,
            see RatingInline) — never a filled star against a misleading "(0)". */}
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
          {hasReviews ? (
            <RatingStars value={p.rating ?? 0} size={12} count={reviewCount} />
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "var(--ink-400)",
              }}
            >
              <Icon name="star" size={12} color="var(--ink-300)" fill="none" />
              {t("common.noReviews")}
            </span>
          )}
        </div>
        {/* Single price line: all-in price + strikethrough original — via Price primitive */}
        {/* Trust row (cash on delivery / 7-day return) lives on the PDP only, not on cards. */}
        {/* marginTop:auto pins price to card bottom so price rows align across the grid */}
        {/* Reserves price + struck + savings space so no-discount and discount
            cards stay equal height. Bump the min-height once to realign all. */}
        <div className="bz-pcard__price" style={{ marginTop: "auto", minHeight: 56, minWidth: 0 }}>
          <Price value={p.price} original={p.original} size="md" locale={locale} />
          {savings >= SAVINGS_THRESHOLD && (
            <div style={{ marginTop: 6 }}>
              <Badge tone="success">
                {t("common.saveAmount", { amount: formatNPR(savings, locale) })}
              </Badge>
            </div>
          )}
        </div>
        {ctaLabel && onCta && (
          <div className="bz-pcard__cta-wrap">
            <Button
              variant="bargainOutline"
              size="sm"
              full
              icon={ctaIcon}
              onClick={(e) => {
                e.stopPropagation();
                onCta(p);
              }}
            >
              {ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Horizontal rail of cards ---------- */
export function ProductRail({
  items,
  onOpen,
  cols,
}: {
  items: Product[];
  onOpen: (p: Product) => void;
  cols?: number;
}) {
  return (
    <div
      className="bz-grid-cards"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols || 5}, 1fr)`, gap: 18 }}
    >
      {items.map((p) => (
        <ProductCard key={p.id} p={p} onClick={onOpen} />
      ))}
    </div>
  );
}

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
  variant = "circle",
  shape = "circle",
}: {
  c: Category;
  onClick: (c: Category) => void;
  compact?: boolean;
  href?: string;
  shortOnMobile?: boolean;
  variant?: "circle" | "card";
  shape?: "circle" | "squircle";
}) {
  const [hov, setHov] = useState(false);
  const locale = useBazaarStore((s) => s.locale);
  const label = displayCategoryLabel(c, locale);
  const shortLabel = shortOnMobile ? CATEGORY_SHORT_NAME[c.id] : undefined;
  const iconName = CATEGORY_ICON[c.id] ?? "tag";
  const iconSrc = CATEGORY_ICON_SRC[c.id];
  const image = categoryImageBySlug[c.id];
  const Tag: React.ElementType = href ? AppLink : "button";
  const tagProps = href ? { href, onNavigate: () => onClick(c) } : { onClick: () => onClick(c) };

  // Card variant — frameless navigation tile: a circular (or squircle) category
  // photo with a centered caption below, sitting directly on the page. Reads as a
  // department menu entry, not a product card. `shape` flips --cat-radius so a
  // single prop switches every tile from circle to squircle. The image is
  // decorative: the visible text label gives the link its accessible name, so the
  // photo stays aria-hidden to avoid a double announcement. Falls back to the line
  // icon only if a slug has no curated image (e.g. an unknown backend category).
  if (variant === "card") {
    return (
      <Tag
        {...tagProps}
        className="bz-cat__card"
        style={{ "--cat-radius": shape === "squircle" ? "16px" : "50%" } as React.CSSProperties}
      >
        <div className="bz-cat__card-thumb">
          {image ? (
            <img src={image.imageSrc} alt="" aria-hidden="true" draggable={false} loading="lazy" />
          ) : (
            <Icon name={iconName} size={30} color="#475569" stroke={1.8} />
          )}
        </div>
        <span className="bz-cat__card-label">
          {shortLabel ? (
            <>
              <span className="bz-hide-mobile">{label}</span>
              <span className="bz-show-mobile">{shortLabel}</span>
            </>
          ) : (
            label
          )}
        </span>
      </Tag>
    );
  }

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
          background: "#f1f5f9",
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
          <Icon name={iconName} size={27} color="#475569" stroke={1.8} />
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

function GuestSignInPopover({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <Button variant="primary" full size="md" onClick={onSignIn}>
        {t("auth.signIn")}
      </Button>
      <p
        style={{
          margin: "10px 0 0",
          textAlign: "center",
          fontSize: ".8125rem",
          color: "var(--ink-500)",
        }}
      >
        {t("guestSignIn.newCustomer")}{" "}
        <AppLink
          href={pathFromScreen("auth")}
          onNavigate={onSignIn}
          className="bz-guest-popover__link"
        >
          {t("guestSignIn.createAccount")}
        </AppLink>
      </p>
    </>
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
        label={t("nav.saved")}
        href={pathFromScreen("saved")}
        onNavigate={() => goAndClose("saved")}
      />
      <NavMenuItem
        icon="message"
        label={t("nav.messages")}
        href={pathFromScreen("messages")}
        onNavigate={() => goAndClose("messages")}
      />
      <NavMenuItem
        icon="bargain"
        label={t("nav.bargains")}
        href={pathFromScreen("bargains")}
        onNavigate={() => goAndClose("bargains")}
      />
      <div style={{ height: 1, background: "var(--line-200)", margin: "6px 4px" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "6px 12px 8px",
        }}
      >
        <span style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
          {t("language.label")}
        </span>
        <LanguageToggle compact />
      </div>
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

/* Inline EN / नेपाली switch for the navy utility bar — text style per the
   prototype, with the active language highlighted. */
function NavLang() {
  const locale = useBazaarStore((s) => s.locale);
  const setLocale = useBazaarStore((s) => s.setLocale);
  return (
    <span className="bz-navbar__lang" role="group" aria-label="Language">
      <button
        type="button"
        lang="en"
        aria-pressed={locale === "en"}
        className={locale === "en" ? "is-active" : ""}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        lang="ne"
        aria-pressed={locale === "ne"}
        className={locale === "ne" ? "is-active" : ""}
        onClick={() => setLocale("ne")}
      >
        नेपाली
      </button>
    </span>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const {
    nav,
    cart,
    cartCount,
    savedProducts,
    savedSellers,
    screen,
    query,
    setQuery,
    submitSearch,
    clearSearch,
  } = useBz();
  const user = useBazaarStore((s) => s.user);
  const authed = useBazaarStore((s) => s.authed);
  const authReady = useBazaarStore((s) => s.authReady);
  const locale = useBazaarStore((s) => s.locale);
  const logoutMutation = useLogout();
  const navLabel = displayName(user, "Account");
  const navFirstName = firstName(user, "Account");
  const { data: categories = [] } = useCategories();
  // Which category the buyer is currently browsing (from `?cat=`), so the mobile
  // strip can highlight the active pill — "All" when no category is selected.
  const activeCatIds = categoryIdsFromSearchParams(useSearchParams());
  // Cart subtotal shown in the navbar — recomputed from the live cart lines the
  // same way checkout does (whole rupees, plain integer sum) so it always matches.
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const savedCount = savedProducts.length + savedSellers.length;
  const [menuOpen, setMenuOpen] = useState(false);
  // Guest sign-in popover — auto-opens once auth settles on a guest session.
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const didAutoOpen = useRef(false);
  // Search category scope (the "All ▾" selector). null = all categories.
  const [scope, setScope] = useState<string | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const deliveryLocation = useBazaarStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useBazaarStore((s) => s.setDeliveryLocation);
  const deliverLabel = formatDeliverToLabel(deliveryLocation, locale);
  const { data: savedAddresses = [] } = useAddresses(authed);
  const createAddress = useCreateAddress();
  // Only open the "Deliver to" picker while the buyer has no saved address yet.
  // Once one exists, the profile is the source of truth, so the chip links there.
  const hasSavedAddress = savedAddresses.length > 0;
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);

  // Open the guest popover exactly once when auth settles and the user is a guest.
  useEffect(() => {
    if (authReady && !authed && !didAutoOpen.current) {
      didAutoOpen.current = true;
      setGuestPopoverOpen(true);
    }
  }, [authReady, authed]);

  // Close the guest popover when the user signs in.
  useEffect(() => {
    if (authed) setGuestPopoverOpen(false);
  }, [authed]);

  const anyAccountOpen = menuOpen || guestPopoverOpen;
  useEffect(() => {
    if (!anyAccountOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (desktopMenuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
      setGuestPopoverOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setGuestPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [anyAccountOpen]);

  useEffect(() => {
    if (!scopeOpen) return;
    const onDocClick = (e: MouseEvent) => {
      // searchField renders on both breakpoints, so match the scope by class
      // rather than a single ref (which would bind to the hidden mobile copy).
      if ((e.target as HTMLElement).closest?.(".bz-navbar__scope-wrap")) return;
      setScopeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScopeOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [scopeOpen]);

  const openDeliver = () => (hasSavedAddress ? nav("profile") : setDeliverOpen(true));
  const runSearch = () => submitSearch(scope ?? undefined);
  const scopeLabel = scope
    ? (CATEGORY_SHORT_NAME[scope] ?? categories.find((c) => c.id === scope)?.en ?? t("nav.search"))
    : t("nav.all");

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

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") runSearch();
  };
  const deliverChip = (
    <button
      type="button"
      onClick={openDeliver}
      aria-haspopup={hasSavedAddress ? undefined : "dialog"}
      aria-expanded={hasSavedAddress ? undefined : deliverOpen}
      aria-label={t("common.deliverToAria", { label: deliverLabel })}
      className="bz-navbar__deliver"
    >
      <Icon name="mapPin" size={14} color="var(--gold)" />
      <span>
        {t("nav.deliverTo")} <strong>{deliverLabel}</strong>
      </span>
      {!hasSavedAddress && <span className="bz-navbar__deliver-change">{t("common.change")}</span>}
    </button>
  );
  const searchField = (
    <div className="bz-navbar__search">
      {/* Category scope — desktop only, mirrors the prototype's "All ▾". */}
      <div className="bz-navbar__scope-wrap bz-hide-mobile">
        <button
          type="button"
          className="bz-navbar__scope"
          aria-haspopup="menu"
          aria-expanded={scopeOpen}
          onClick={() => setScopeOpen((o) => !o)}
        >
          <span>{scopeLabel}</span>
          <Icon name="chevronDown" size={13} />
        </button>
        {scopeOpen && (
          <div role="menu" className="bz-navbar__scope-menu no-scrollbar">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={scope === null}
              className={`bz-navbar__scope-item${scope === null ? " is-active" : ""}`}
              onClick={() => {
                setScope(null);
                setScopeOpen(false);
              }}
            >
              {t("home.allCategories")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="menuitemradio"
                aria-checked={scope === c.id}
                className={`bz-navbar__scope-item${scope === c.id ? " is-active" : ""}`}
                onClick={() => {
                  setScope(c.id);
                  setScopeOpen(false);
                }}
              >
                {displayCategoryLabel(c, locale)}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Leading magnifier — mobile only (desktop puts the icon in the red button). */}
      <span className="bz-navbar__search-lead bz-show-mobile" aria-hidden="true">
        <Icon name="search" size={17} color="var(--ink-400)" />
      </span>
      <input
        className="bz-navbar__search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onSearchKey}
        placeholder={t("home.searchPlaceholder")}
        aria-label={t("nav.searchProducts")}
      />
      {query && (
        <button
          type="button"
          aria-label={t("common.a11y.clearSearch")}
          className="bz-navbar__search-clear"
          onClick={(e) => {
            clearSearch();
            // Refocus the input in THIS search field (the component renders one
            // per breakpoint, so target the sibling rather than a shared ref).
            e.currentTarget.closest(".bz-navbar__search")?.querySelector("input")?.focus();
          }}
        >
          <Icon name="x" size={16} />
        </button>
      )}
      <button
        type="button"
        aria-label={t("nav.search")}
        onClick={runSearch}
        className="bz-navbar__search-btn"
      >
        <Icon name="search" size={18} color="#fff" className="bz-hide-mobile" />
        <span className="bz-show-mobile">{t("nav.go")}</span>
      </button>
    </div>
  );
  const navCategories = categories.slice(0, 20);
  const categoryStrip = (
    <>
      {navCategories.map((c) => (
        <AppLink
          key={c.id}
          href={browsePath({ cat: c.id })}
          onNavigate={() => nav("browse", { cat: c.id })}
          className="bz-navbar__cat"
        >
          {displayCategoryLabel(c, locale)}
        </AppLink>
      ))}
    </>
  );
  // Mobile mirrors the desktop category strip but leads with an "All" pill that
  // clears the category filter; the active pill is highlighted.
  const mobileCategoryStrip = (
    <>
      <AppLink
        href={browsePath({})}
        onNavigate={() => nav("browse")}
        className="bz-navbar__cat bz-navbar__cat--all"
      >
        {t("nav.all")}
      </AppLink>
      {navCategories.map((c) => (
        <AppLink
          key={c.id}
          href={browsePath({ cat: c.id })}
          onNavigate={() => nav("browse", { cat: c.id })}
          className={`bz-navbar__cat${activeCatIds.includes(c.id) ? " is-active" : ""}`}
        >
          {displayCategoryLabel(c, locale)}
        </AppLink>
      ))}
    </>
  );

  return (
    <header className="bz-navbar">
      {/* ===================== DESKTOP ===================== */}
      <div className="bz-navbar__desktop bz-hide-mobile">
        {/* Tier 1 — utility */}
        <div className="bz-navbar__utility">
          <div className="bz-navbar__utility-inner container">
            {deliverChip}
            <div className="bz-navbar__utility-links">
              <AppLink href={sellerSignupPath()} className="bz-navbar__util-link">
                {t("footer.becomeSeller")}
              </AppLink>
              <AppLink href={pathFromScreen("tracking")} className="bz-navbar__util-link">
                {t("footer.trackOrder")}
              </AppLink>
              <AppLink href={pathFromScreen("help")} className="bz-navbar__util-link">
                {t("footer.helpCol")}
              </AppLink>
              <NavLang />
            </div>
          </div>
        </div>

        {/* Tier 2 — brand + search + actions */}
        <div className="bz-navbar__main">
          <div className="bz-navbar__main-inner container">
            <AppLink
              href={pathFromScreen("home")}
              ariaLabel={t("nav.homeAria")}
              className="bz-navbar__brand"
            >
              <Logo height={38} />
            </AppLink>
            {searchField}
            <div className="bz-navbar__actions">
              <AppLink href={pathFromScreen("cart")} className="bz-navbar__action">
                <span className="bz-navbar__action-ic">
                  <Icon name="cart" size={23} color="#fff" />
                  {cartCount > 0 && <span className="bz-navbar__action-badge">{cartCount}</span>}
                </span>
                <span className="bz-navbar__action-text">
                  <span className="bz-navbar__action-cap">{t("nav.cart")}</span>
                  <span className="bz-navbar__action-main tnum">
                    {formatNPR(cartTotal, locale)}
                  </span>
                </span>
              </AppLink>
              <AppLink
                href={pathFromScreen("video")}
                className={`bz-navbar__action${screen === "video" ? " is-active" : ""}`}
              >
                <Icon name="video" size={22} color="var(--on-navy-300)" />
                <span className="bz-navbar__action-text">
                  <span className="bz-navbar__action-cap">BazaarCo</span>
                  <span className="bz-navbar__action-main">{t("nav.watch")}</span>
                </span>
              </AppLink>
              <AppLink href={pathFromScreen("saved")} className="bz-navbar__action">
                <span className="bz-navbar__action-ic">
                  <Icon name="heart" size={22} color="var(--on-navy-300)" />
                  {savedCount > 0 && (
                    <span className="bz-navbar__action-badge bz-navbar__action-badge--gold">
                      {savedCount}
                    </span>
                  )}
                </span>
                <span className="bz-navbar__action-text">
                  <span className="bz-navbar__action-cap">{t("nav.your")}</span>
                  <span className="bz-navbar__action-main">{t("nav.saved")}</span>
                </span>
              </AppLink>
              <div ref={desktopMenuRef} className="bz-navbar__account-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (authed) {
                      setMenuOpen((o) => !o);
                    } else {
                      setGuestPopoverOpen((o) => !o);
                    }
                  }}
                  aria-haspopup={authed ? "menu" : "dialog"}
                  aria-expanded={authed ? menuOpen : guestPopoverOpen}
                  aria-controls="navbar-account-panel"
                  className={`bz-navbar__action bz-navbar__account-btn${menuOpen || guestPopoverOpen ? " is-open" : ""}`}
                >
                  {authed ? (
                    <BuyerAvatar user={user} size={26} fontSize={12} />
                  ) : (
                    <Icon name="user" size={22} color="var(--on-navy-300)" />
                  )}
                  <span className="bz-navbar__action-text">
                    <span className="bz-navbar__action-cap">{t("nav.account")}</span>
                    <span className="bz-navbar__action-main">
                      {authed ? navFirstName : t("nav.signIn")}{" "}
                      <Icon name="chevronDown" size={13} color="currentColor" />
                    </span>
                  </span>
                </button>
                {menuOpen && authed && (
                  <div id="navbar-account-panel" role="menu" className="bz-navbar__menu">
                    <AccountMenuPanel
                      navLabel={navLabel}
                      user={user}
                      authed={authed}
                      goAndClose={goAndClose}
                      onLogout={requestLogout}
                    />
                  </div>
                )}
                {guestPopoverOpen && !authed && (
                  <div
                    id="navbar-account-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("auth.signIn")}
                    className="bz-navbar__menu bz-navbar__menu--guest"
                  >
                    <GuestSignInPopover
                      onSignIn={() => {
                        setGuestPopoverOpen(false);
                        nav("auth");
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tier 3 — category nav */}
        <div className="bz-navbar__cats">
          <div className="bz-navbar__cats-inner container no-scrollbar">{categoryStrip}</div>
        </div>
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="bz-navbar__mobile bz-show-mobile">
        <div className="bz-navbar__m-bar">
          <div className="bz-navbar__m-bar-inner container">
            <div className="bz-navbar__m-top">
              <AppLink
                href={pathFromScreen("home")}
                ariaLabel={t("nav.homeAria")}
                className="bz-navbar__brand"
              >
                <Logo height={24} />
              </AppLink>
              <div className="bz-navbar__m-icons">
                <AppLink
                  href={pathFromScreen("saved")}
                  ariaLabel={t("nav.saved")}
                  className="bz-navbar__m-icon"
                >
                  <Icon name="heart" size={22} color="var(--on-navy-300)" />
                  {savedCount > 0 && (
                    <span className="bz-navbar__action-badge bz-navbar__action-badge--gold">
                      {savedCount}
                    </span>
                  )}
                </AppLink>
                <AppLink
                  href={pathFromScreen("cart")}
                  ariaLabel={t("nav.cart")}
                  className="bz-navbar__m-icon"
                >
                  <Icon name="cart" size={22} color="#fff" />
                  {cartCount > 0 && <span className="bz-navbar__action-badge">{cartCount}</span>}
                </AppLink>
              </div>
            </div>
            {searchField}
            {deliverChip}
          </div>
        </div>
        <div className="bz-navbar__cats-strip">
          <div className="bz-navbar__cats-strip-inner container no-scrollbar">
            {mobileCategoryStrip}
          </div>
        </div>
      </div>

      <DeliverToModal
        open={deliverOpen}
        value={deliveryLocation}
        onClose={() => setDeliverOpen(false)}
        onSave={async (loc: DeliveryLocation) => {
          setDeliveryLocation(loc);
          setDeliverOpen(false);
          toast.info(t("delivery.deliveringTo", { label: formatDeliverToLabel(loc, locale) }));
          // Mirror checkout: persist the entered address to the buyer's profile
          // so it becomes their (first, default) saved address.
          if (authed) {
            try {
              await createAddress.mutateAsync(deliveryToSavePayload(loc, "Home", true));
            } catch {
              /* local delivery location already set; ignore sync error */
            }
          }
        }}
      />

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

/* ---------- Checkout header ----------
   Slim header for the payment funnel: clickable logo back to safety + a "secure"
   cue, and no search/categories that would tempt the buyer back out of checkout. */
export function CheckoutHeader() {
  const { t } = useTranslation();
  return (
    <header className="bz-checkout-header">
      <div className="bz-checkout-header__inner container">
        <AppLink
          href={pathFromScreen("home")}
          ariaLabel={t("nav.homeAria")}
          className="bz-navbar__brand"
        >
          <Logo height={32} />
        </AppLink>
        <span className="bz-checkout-header__secure">
          <Icon name="shieldCheck" size={18} color="var(--on-navy-300)" />
          {t("checkout.secure")}
        </span>
      </div>
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
        { label: t("footer.faq"), href: pathFromScreen("faq") },
        { label: t("footer.contactUs"), href: pathFromScreen("contact") },
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
        { label: t("footer.becomeSeller"), href: sellerSignupPath() },
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
        className="bz-footer-grid container"
        style={{
          position: "relative",
          zIndex: 2,
          paddingTop: 72,
          paddingBottom: 48,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--sp-8)",
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
          className="bz-row-4up container"
          style={{
            paddingTop: 28,
            paddingBottom: 28,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--sp-6)",
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
