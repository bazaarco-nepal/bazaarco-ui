"use client";

import React, { useState, useEffect } from "react";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  Chip,
  StatusPill,
  Price,
  Placeholder,
  VideoPlayer,
  SkeletonCard,
  EmptyState,
  QtyStepper,
  Toast,
  SectionHead,
  AllInPriceCard,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  BottomNav,
  LandmarkAddress,
  usePaged,
  usePages,
  LoadMore,
  PageBar,
  BackToTop,
  ApiState,
  AppLink,
} from "@/components/ui";
import { browsePath, pathFromScreen } from "@/config/routes";
import { ASSETS } from "@/config/assets";
import { useCatalog } from "@/hooks/use-catalog";
import { useHome } from "@/hooks/use-home";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName } from "@/lib/display";
import {
  BazaarCtx,
  useBz,
  Himalaya,
  KathmanduSkyline,
  ProductCard,
  ProductRail,
  CategoryTile,
  Navbar,
  Footer,
  DevViewSwitcher,
} from "@/components/common";
import { PicksSections } from "./_components/picks-tabs";
import { SearchOverlay } from "./_components/search-overlay";
import { BestPicksHero, BestPicksBanner } from "./_components/best-picks-hero";

function Countdown({ initial = 3 * 3600 + 42 * 60 + 9 }) {
  const [s, setS] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setS((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const Box = ({ v }) => (
    <span
      className="tnum"
      style={{
        background: "var(--ink-900)",
        color: "#fff",
        borderRadius: "var(--r-sm)",
        padding: "4px 8px",
        fontWeight: 800,
        fontSize: "1rem",
        minWidth: 34,
        textAlign: "center",
        display: "inline-block",
      }}
    >
      {v}
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Box v={hh} />
      <span style={{ color: "#fff", fontWeight: 800 }}>:</span>
      <Box v={mm} />
      <span style={{ color: "#fff", fontWeight: 800 }}>:</span>
      <Box v={ss} />
    </span>
  );
}

function VideoRailCard({ p, onOpen }) {
  return (
    <div
      onClick={() => onOpen(p)}
      style={{ cursor: "pointer", flexShrink: 0, width: 188, position: "relative" }}
    >
      <div style={{ position: "relative" }}>
        <VideoPlayer
          tint={p.tint}
          icon={p.icon}
          ratio="9 / 14"
          compact
          label="WATCH"
          thumb={p.videoThumb}
          src={p.videoUrl}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            fontSize: ".875rem",
            fontWeight: 600,
            color: "var(--ink-900)",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <Price value={p.price} size="sm" />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              color: "var(--gold)",
              fontSize: ".6875rem",
              fontWeight: 700,
            }}
          >
            <Icon name="badgeCheck" size={13} color="var(--gold)" />
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonRail({ cols = 5 }) {
  return (
    <div
      className="bz-grid-cards"
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 18 }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function Home() {
  const { nav, openProduct, cartCount } = useBz();
  const user = useBazaarStore((s) => s.user);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: homeData, isLoading: homeLoading, isError: homeError, error: homeErr } = useHome();
  const catalog = useCatalog();
  const loading = homeLoading || catalog.isLoading;
  const isError = homeError || catalog.isError;
  const error = homeErr ?? catalog.error;
  const { products, categories, byId, videoProducts, flashProducts } = catalog;
  const trending = homeData?.trending?.length ? homeData.trending : [];
  const madeInNepal = homeData?.trending?.length ? homeData.trending.slice(0, 5) : [];
  const buyerGreeting = user ? displayName(user, "there") : null;
  const feedPaged = usePaged(
    products.filter((p) => !p.outOfStock),
    20,
  );
  const W = ({ children, style, className }) => (
    <section
      className={`bz-container-pad${className ? ` ${className}` : ""}`}
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 28px", ...style }}
    >
      {children}
    </section>
  );
  // The static shell (hero, mobile header, category frame, banners) needs no API
  // data, so it paints immediately — no full-page spinner. Only the data-backed
  // sections (categories, picks, feed) show their own skeletons while loading.
  const catalogLoading = catalog.isLoading;
  return (
    <>
      <div style={{ paddingBottom: 8 }}>
        <BackToTop />
        {/* Desktop hero — hidden on phones */}
        <div className="bz-hide-mobile">
          <W className="bz-home-hero" style={{ paddingTop: 22 }}>
            <BestPicksHero />
          </W>
        </div>

        {/* Mobile-only header — greeting + wishlist on top, search below.
            Sticky so the name row + search bar stay pinned while content scrolls. */}
        <div
          className="bz-show-mobile"
          style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--page)" }}
        >
          <W style={{ paddingTop: 18, paddingBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--tint-red-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <img
                  src="/hiro%20hi%20Background%20Removed.png"
                  alt="Hiro"
                  style={{ width: 34, height: 34, objectFit: "contain" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", fontWeight: 600 }}>
                  Hello 👋
                </div>
                <div
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {buyerGreeting ?? "there"}
                </div>
              </div>
              <IconButton
                name="cart"
                label="Cart"
                badge={cartCount}
                href={pathFromScreen("cart")}
                size={44}
              />
            </div>

            {/* Search — tapping opens the full search overlay (no inline typing on home) */}
            <button
              type="button"
              aria-label="Search for products, brands"
              onClick={() => setSearchOpen(true)}
              style={{
                width: "100%",
                height: 50,
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-full)",
                padding: "0 16px",
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Icon name="search" size={19} color="var(--ink-400)" />
              <span style={{ color: "var(--ink-400)", fontSize: ".9375rem" }}>
                Search for products, brands…
              </span>
            </button>
          </W>
        </div>

        {/* flash sale */}
        {/* <W style={{ paddingTop: 24 }}>
          <div
            className="bz-flash-head"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              rowGap: 10,
              background: "linear-gradient(90deg, var(--red), var(--saffron))",
              borderRadius: "var(--r-lg) var(--r-lg) 0 0",
              padding: "14px 22px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#fff",
                flexWrap: "wrap",
                rowGap: 6,
                minWidth: 0,
              }}
            >
              <Icon name="zap" size={22} fill="#fff" color="#fff" />
              <span style={{ fontWeight: 800, fontSize: "1.125rem", whiteSpace: "nowrap" }}>
                Flash Sale
              </span>
              <span style={{ fontSize: ".8125rem", opacity: 0.9, whiteSpace: "nowrap" }}>
                Ends in
              </span>
              <Countdown />
            </div>
            <AppLink
              href={pathFromScreen("browse")}
              style={{
                background: "rgba(255,255,255,.2)",
                border: "1px solid rgba(255,255,255,.4)",
                color: "#fff",
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: "var(--r-md)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
            >
              View all <Icon name="arrowRight" size={16} />
            </AppLink>
          </div>
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderTop: "none",
              borderRadius: "0 0 var(--r-lg) var(--r-lg)",
              padding: 18,
            }}
          >
            {loading ? (
              <SkeletonRail cols={5} />
            ) : (
              <ProductRail items={flashProducts().slice(0, 5)} onOpen={openProduct} cols={5} sale />
            )}
          </div>
        </W> */}

        {/* categories — desktop wraps header + grid in a card (.bz-cat-card);
            on mobile the card is `display:contents` so the layout is unchanged. */}
        <W className="bz-home-section" style={{ paddingTop: 44 }}>
          <div className="bz-cat-card">
            <SectionHead
              title="Shop by category"
              action="All categories"
              actionHref={pathFromScreen("browse")}
            />
            <div className="bz-cat-row">
              {catalogLoading && !categories
                ? Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        className="skel"
                        style={{ width: 64, height: 64, borderRadius: "50%" }}
                      />
                      <div className="skel" style={{ height: 10, width: 48, borderRadius: 4 }} />
                    </div>
                  ))
                : (categories ?? []).map((c) => (
                    <CategoryTile
                      key={c.id}
                      c={c}
                      compact
                      href={browsePath({ cat: c.id })}
                      onClick={() => nav("browse", { cat: c.id })}
                    />
                  ))}
            </div>
          </div>
        </W>

        {/* Best Picks promo — mobile placement (after categories, per layout) */}
        <div className="bz-show-mobile">
          <W style={{ paddingTop: 32 }}>
            <BestPicksBanner />
          </W>
        </div>

        <PicksSections />

        {/* trending in Kathmandu — hyperlocal */}
        {/* <W style={{ paddingTop: 52 }}>
          <SectionHead
            eyebrow={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="mapPin" size={13} color="var(--red)" /> Trending in Kathmandu
              </span>
            }
            title="What your city is buying right now"
            action="See more"
            actionHref={pathFromScreen("browse")}
          />
          {loading ? (
            <SkeletonRail cols={5} />
          ) : (
            <ProductRail items={trending} onOpen={openProduct} cols={5} />
          )}
        </W> */}

        {/* video shopping rail — desktop only */}
        {/* <div className="bz-hide-mobile">
          <W style={{ paddingTop: 52 }}>
            <div
              style={{
                background: "var(--tint-blue-50)",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-xl)",
                padding: "30px 32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 22,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "var(--red)",
                      marginBottom: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="video" size={15} color="var(--red)" /> Watch
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "var(--ink-900)",
                    }}
                  >
                    See it in motion before you <span style={{ color: "var(--red)" }}>buy</span>
                  </h2>
                </div>
                <Button
                  variant="primary"
                  href={pathFromScreen("video")}
                  iconRight="arrowRight"
                >
                  Open video feed
                </Button>
              </div>
              <div
                className="no-scrollbar"
                style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 4 }}
              >
                {videoProducts().map((p) => (
                  <VideoRailCard key={p.id} p={p} onOpen={openProduct} />
                ))}
              </div>
            </div>
          </W>
        </div> */}

        {/* made in nepal */}
        {/* <W style={{ paddingTop: 52, position: "relative" }}>
          <SectionHead
            eyebrow="Made in Nepal"
            title="Loved in Nepal"
            action="See more"
            actionHref={pathFromScreen("browse")}
          />
          {loading ? (
            <SkeletonRail cols={5} />
          ) : (
            <ProductRail items={madeInNepal} onOpen={openProduct} cols={5} />
          )}
        </W> */}

        {/* Endless product feed — shown on both web and mobile */}
        <W className="bz-home-section" style={{ paddingTop: 36 }}>
          <SectionHead title="More to explore" />
          {isError && !catalogLoading ? (
            <EmptyState
              title="Couldn't load products"
              message="Something went wrong fetching the catalog. Please try again."
              cta="Reload"
              onCta={() => window.location.reload()}
            />
          ) : (
            <>
              <div className="bz-picks-grid">
                {catalogLoading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : feedPaged.visible.map((p) => (
                      <ProductCard key={p.id} p={p} onClick={openProduct} />
                    ))}
              </div>
              {!catalogLoading && (
                <LoadMore
                  paged={feedPaged}
                  noun="products"
                  size="sm"
                  style={{ paddingBottom: 12 }}
                />
              )}
            </>
          )}
        </W>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
