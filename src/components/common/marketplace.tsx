"use client";

import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  Chip,
  VerifiedBadge,
  StatusPill,
  Price,
  Placeholder,
  VideoPlayer,
  SkeletonCard,
  EmptyState,
  QtyStepper,
  Toast,
  SectionHead,
  TINTS,
  AllInPriceCard,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  BottomNav,
  LandmarkAddress,
  DeliverToModal,
  usePaged,
  usePages,
  LoadMore,
  PageBar,
  BackToTop,
  AppLink,
} from "@/components/ui";
import { pathFromScreen } from "@/config/routes";
import { useCatalog } from "@/hooks/use-catalog";
import { useLogout } from "@/hooks/use-auth";
import { displayName, userInitial } from "@/lib/display";
import { useBazaarStore } from "@/store/bazaar-store";
import { formatDeliverToLabel } from "@/lib/delivery-location";
import { ASSETS } from "@/config/assets";

import type { BazaarContextValue } from "@/types/bazaar";

export const BazaarCtx = createContext<BazaarContextValue | null>(null);
export const useBz = (): BazaarContextValue => {
  const ctx = useContext(BazaarCtx);
  if (!ctx) {
    throw new Error("useBz must be used within BazaarProvider");
  }
  return ctx;
};

/* ---------- Himalayan outline (legacy hero accent) ---------- */
export function Himalaya({ color = "rgba(255,255,255,.18)", height = 90, style }) {
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

  const tint = TINTS[seller.tint] ?? TINTS.slate;

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
          {seller.verified && <VerifiedBadge />}
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
export function ProductCard({ p, onClick, sale = false }) {
  const { toggleWish, wish } = useBz();
  const { sellerOf } = useCatalog();
  const [hov, setHov] = useState(false);
  const s = sellerOf(p);
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
        ariaLabel={p.name}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />
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
              alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ) : (
          <Placeholder icon={p.icon} tint={p.tint} radius="0" ratio="1 / 1" />
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
          {/* 44px tap target per WCAG; visible circle kept smaller (34px) to lighten the image */}
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,255,255,.95)",
              boxShadow: "var(--sh-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="heart" size={18} fill={wished ? "currentColor" : "none"} />
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
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
        }}
      >
        <div
          className="bz-pcard__title"
          style={{
            fontSize: ".9375rem",
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
          {p.name}
        </div>
        {/* Compact rating: one star + value + review count (no 5-star row) */}
        <div
          className="bz-pcard__rating"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            minHeight: "1.25rem",
            fontSize: ".8125rem",
            color: "var(--ink-500)",
          }}
        >
          <Icon name="star" size={13} color="var(--gold)" fill="var(--gold)" />
          <span className="tnum" style={{ fontWeight: 700, color: "var(--ink-700)" }}>
            {(p.rating ?? 0).toFixed(1)}
          </span>
          <span style={{ color: "var(--ink-400)" }}>· {p.reviews} reviews</span>
          {sale && <span style={{ color: "var(--ink-400)" }}>· {soldLabel}</span>}
          {s?.verified && (
            <Icon name="badgeCheck" size={13} color="var(--gold)" title="Verified seller" />
          )}
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
export function SaleProductCard(props) {
  return <ProductCard {...props} sale />;
}

/* ---------- Horizontal rail of cards ---------- */
export function ProductRail({ items, onOpen, cols, sale = false }) {
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
  clothing: "shirt",
  footwear: "sneaker",
  beauty: "lipstick",
  electronics: "phone",
  accessories: "handbag",
  home: "home",
  furniture: "sofa",
  grocery: "basket",
  books: "book",
  sports: "football",
  handicraft: "temple",
  baby: "pacifier",
};

// `compact` (home grid) hides the Nepali subtitle and shortens the label to a
// single word so 4 cols stay calm. Full label + Nepali live on the browse page.
export function CategoryTile({ c, onClick, compact = false, href }) {
  const [hov, setHov] = useState(false);
  const t = CAT_TINTS[c.tint] ?? CAT_TINTS.red;
  const label = compact ? c.en.split(/\s*&\s*|\s+/)[0] : c.en;
  const iconName = CATEGORY_ICON[c.id] ?? "tag";
  // Nav use (e.g. home → /browse) passes `href` and renders a real anchor so the
  // browser can open it in a new tab. Filter use (browse page) omits href and
  // stays a button toggling an in-page facet.
  const Tag = href ? AppLink : "button";
  const tagProps = href ? { href, onNavigate: () => onClick(c) } : { onClick: () => onClick(c) };
  return (
    <Tag
      {...tagProps}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
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
          background: hov ? t.fg : t.bg,
          boxShadow: hov ? "var(--sh-2)" : "var(--sh-1)",
          transform: hov ? "translateY(-2px)" : "translateY(0)",
          transition: "all var(--dur-standard) var(--ease)",
        }}
      >
        <Icon name={iconName} size={27} color={hov ? "#fff" : t.fg} stroke={1.8} />
      </div>
      <div style={{ textAlign: "center", lineHeight: 1.2 }}>
        <div
          className="bz-cat__en"
          style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}
        >
          {label}
        </div>
        {!compact && c.ne && (
          <div
            className="ne bz-cat__ne"
            style={{ fontSize: ".6875rem", fontWeight: 600, color: "var(--ink-400)", marginTop: 2 }}
          >
            {c.ne}
          </div>
        )}
      </div>
    </Tag>
  );
}

/* ---------- Navbar ---------- */
export const SEARCH_HINTS = [
  "Search · खोज्नुहोस्",
  'Try "Pashmina shawl"',
  'Try "ढाका टोपी"',
  'Try "earbuds"',
  'Try "honey"',
];
export function DevViewSwitcher() {
  const { nav, screen } = useBz();
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

export function NavMenuItem({ icon, label, danger, onClick, href, onNavigate }) {
  const [hov, setHov] = useState(false);
  const color = danger ? "var(--red)" : "var(--ink-700)";
  const Tag = href ? AppLink : "button";
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

export function Navbar() {
  const { nav, cartCount, wish, wishSellers, screen, query, setQuery, submitSearch, toast } =
    useBz();
  const user = useBazaarStore((s) => s.user);
  const authed = useBazaarStore((s) => s.authed);
  const logoutMutation = useLogout();
  const navLabel = displayName(user, "Account");
  const navInitial = userInitial(user);
  const [hint, setHint] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const deliveryLocation = useBazaarStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useBazaarStore((s) => s.setDeliveryLocation);
  const deliverLabel = formatDeliverToLabel(deliveryLocation);
  const menuRef = useRef(null);
  useEffect(() => {
    const id = setInterval(() => setHint((h) => (h + 1) % SEARCH_HINTS.length), 2800);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  const goAndClose = (s) => {
    setMenuOpen(false);
    nav(s);
  };
  return (
    <header
      // Home owns its own mobile header (greeting + search), so suppress the
      // shared navbar on phones there; keep it on desktop and all other screens.
      className={screen === "home" ? "bz-hide-mobile" : undefined}
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 100,
        background: "#fff",
        borderBottom: "1px solid var(--line-200)",
      }}
    >
      {/* trust ribbon */}
      <div
        className="bz-hide-mobile"
        style={{
          background: "var(--blue-deep)",
          color: "rgba(255,255,255,.92)",
          fontSize: ".75rem",
          padding: "8px 0",
          fontWeight: 500,
        }}
      >
        <div
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="bargain" size={13} color="#fff" /> Bargain freely with every seller
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="check" size={13} color="#fff" /> Verified sellers
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="returns" size={13} color="#fff" /> 7-day returns
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="lock" size={13} color="#fff" /> eSewa · Khalti · IME
          </span>
        </div>
      </div>
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "0 28px",
          height: 72,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <AppLink
          href={pathFromScreen("home")}
          ariaLabel="BazaarCo home"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            display: "inline-flex",
          }}
        >
          {/* Desktop: full-size logo. Mobile: smaller logo so search owns the bar. */}
          <span className="bz-hide-mobile">
            <Logo height={38} />
          </span>
          <span className="bz-show-mobile">
            <Logo height={26} />
          </span>
        </AppLink>
        <button
          type="button"
          onClick={() => setDeliverOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={deliverOpen}
          className="bz-hide-mobile"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            padding: "0 12px",
            background: "var(--line-100)",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-md)",
            cursor: "pointer",
            flexShrink: 0,
            color: "var(--ink-700)",
            fontWeight: 600,
            fontSize: ".8125rem",
          }}
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
              Deliver to
            </div>
            <div>{deliverLabel}</div>
          </div>
          <Icon name="chevronDown" size={14} color="var(--ink-500)" />
        </button>
        <DeliverToModal
          open={deliverOpen}
          value={deliveryLocation}
          onClose={() => setDeliverOpen(false)}
          onSave={(loc) => {
            setDeliveryLocation(loc);
            setDeliverOpen(false);
            toast(`Delivering to ${formatDeliverToLabel(loc)}`);
          }}
        />
        <div style={{ flex: 1, position: "relative" }}>
          <button
            type="button"
            aria-label="Search"
            onClick={submitSearch}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              border: "none",
              borderRadius: "50%",
              background: "transparent",
              color: "var(--ink-400)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="search" size={19} />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={SEARCH_HINTS[hint]}
            style={{
              width: "100%",
              height: 48,
              border: `1.5px solid ${searchFocused ? "var(--red)" : "var(--line-200)"}`,
              borderRadius: "var(--r-full)",
              padding: "0 16px 0 48px",
              fontSize: ".9375rem",
              fontFamily: "var(--font-sans)",
              background: "#fff",
              outline: "none",
              transition: "border-color var(--dur-standard) var(--ease)",
            }}
          />
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <AppLink
            href={pathFromScreen("video")}
            className="bz-hide-mobile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: screen === "video" ? "var(--tint-red-50)" : "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
              color: "var(--red)",
              fontWeight: 700,
              fontSize: ".875rem",
              textDecoration: "none",
            }}
          >
            <Icon name="video" size={19} /> Watch
          </AppLink>
          <span className="bz-hide-mobile">
            <IconButton
              name="heart"
              label="Wishlist"
              badge={wish.length + wishSellers.length}
              href={pathFromScreen("wishlist")}
            />
          </span>
          {/* Bargain — BazaarCo's core differentiator. Desktop topbar only; on mobile
              search owns the bar and bargain lives in the search flow. */}
          <AppLink
            href={pathFromScreen("bargains")}
            ariaLabel="Bargain"
            title="Bargain · मोलतोल"
            className="bz-hide-mobile"
            style={{
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--red)",
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--r-md)",
              flexShrink: 0,
            }}
          >
            <Icon name="bargain" size={20} color="#fff" />
          </AppLink>
          {/* Cart — desktop topbar only; mobile reaches it via bottom nav. */}
          <span className="bz-hide-mobile">
            <IconButton name="cart" label="Cart" badge={cartCount} href={pathFromScreen("cart")} />
          </span>
          <div ref={menuRef} className="bz-hide-mobile" style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${menuOpen ? "var(--blue)" : "var(--line-200)"}`,
                background: menuOpen ? "var(--tint-blue-50)" : "#fff",
                cursor: "pointer",
                padding: "0 12px 0 8px",
                height: 40,
                borderRadius: "var(--r-md)",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--blue-deep)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {navInitial}
              </span>
              <span style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
                {navLabel}
              </span>
              <Icon name="chevronDown" size={14} color="var(--ink-500)" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 240,
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--sh-3)",
                  padding: 6,
                  zIndex: 200,
                }}
              >
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
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--blue-deep)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {navInitial}
                  </span>
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
                      View profile
                    </span>
                  </span>
                </AppLink>
                <NavMenuItem
                  icon="package"
                  label="My orders"
                  href={pathFromScreen("orders")}
                  onNavigate={() => goAndClose("orders")}
                />
                <div style={{ height: 1, background: "var(--line-200)", margin: "6px 4px" }} />
                {authed ? (
                  <NavMenuItem
                    icon="x"
                    label="Log out"
                    danger
                    onClick={() =>
                      logoutMutation.mutate(undefined, { onSuccess: () => goAndClose("home") })
                    }
                  />
                ) : (
                  <NavMenuItem
                    icon="user"
                    label="Sign in"
                    href={pathFromScreen("auth")}
                    onNavigate={() => goAndClose("auth")}
                  />
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  const { nav } = useBz();
  const cols = [
    { h: "BazaarCo", links: ["About us", "Careers", "Press", "Seller stories"] },
    { h: "Buy", links: ["How to order", "Payment options", "Delivery", "Returns & refunds"] },
    {
      h: "Sell",
      links: ["Become a seller", "Seller dashboard", "Commission & fees", "Seller policies"],
    },
    { h: "Help", links: ["Contact support", "Track order", "FAQs", "Report an issue"] },
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
      {/* skyline backdrop — sits behind all content, top-anchored */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          backgroundImage: `url(${ASSETS.skyline})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 75%",
          backgroundSize: "78% auto",
          filter: "invert(1) grayscale(1) brightness(1.6) contrast(1.45)",
          mixBlendMode: "screen",
          opacity: 0.08,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 40%, #000 78%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 40%, #000 78%, transparent 100%)",
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
          padding: "120px 28px 40px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
          gap: 32,
        }}
      >
        <div>
          <Logo height={34} mono />
          <p
            className="bz-hide-mobile"
            style={{
              color: "rgba(255,255,255,.65)",
              fontSize: ".875rem",
              marginTop: 16,
              maxWidth: 240,
            }}
          >
            Built for the way Nepal shops. Low commission, no hidden charges, video-first shopping.
          </p>
        </div>
        {cols.map((col, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: ".8125rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 14,
                color: "rgba(255,255,255,.9)",
              }}
            >
              {col.h}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map((l, j) => (
                <AppLink key={j} href={pathFromScreen("home")} className="bz-footer-link">
                  {l}
                </AppLink>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "18px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: ".8125rem" }}>
            © 2026 BazaarCo Nepal Pvt. Ltd.
          </span>
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: ".8125rem" }}>
            Privacy · Terms
          </span>
        </div>
      </div>
    </footer>
  );
}
