"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Logo,
  Button,
  Spinner,
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
  usePages,
  LoadMore,
  BackToTop,
  ApiState,
  AppLink,
} from "@/components/ui";
import { browsePath, pathFromScreen, searchPath } from "@/config/routes";
import { ASSETS } from "@/config/assets";
import { useHome } from "@/hooks/use-home";
import { useHomeExploreFeed } from "@/hooks/use-home-explore";
import { useBazaarStore } from "@/store/bazaar-store";
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
import type { Product } from "@/types";
import { HomeHero } from "./_components/home-hero";
import { FlashSaleRail, FlashSaleMobile } from "./_components/flash-sale";

function Countdown({ initial = 3 * 3600 + 42 * 60 + 9 }) {
  const [s, setS] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setS((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const Box = ({ v }: { v: string }) => (
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

function VideoRailCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  return (
    <div
      onClick={() => onOpen(p)}
      className="bz-hover-lift"
      style={{
        cursor: "pointer",
        flexShrink: 0,
        width: 188,
        position: "relative",
        borderRadius: "var(--r-md)",
      }}
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
          publicId={p.videoPublicId}
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
  const { t } = useTranslation();
  const { nav, openProduct, cartCount } = useBz();
  const { data: homeData, isLoading: homeLoading, isError: homeError, error: homeErr } = useHome();
  const exploreFeed = useHomeExploreFeed(homeData?.explore);
  const loading = homeLoading;
  const isError = homeError;
  const error = homeErr;
  const categories = homeData?.categories;
  const W = ({
    children,
    style,
    className,
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }) => (
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
  const catalogLoading = homeLoading && !categories;
  return (
    <>
      <div style={{ paddingBottom: 8 }}>
        <BackToTop />
        {/* Desktop hero — carousel beside the Flash Sale rail. Hidden on phones. */}
        <div className="bz-hide-mobile">
          <W className="bz-home-hero" style={{ paddingTop: 22 }}>
            <div className="bz-home-herorow">
              <HomeHero />
              <FlashSaleRail />
            </div>
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
              href={searchPath()}
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

        {/* Hero carousel — mobile placement (under the header, above categories). */}
        <div className="bz-show-mobile">
          <W style={{ paddingTop: 14 }}>
            <HomeHero />
          </W>
        </div>

        {/* Shop by categories — bordered card tiles (revamp). */}
        <W className="bz-home-section bz-home-categories" style={{ paddingTop: 28 }}>
          <SectionHead
            title={t("home.shopByCategory")}
            action={t("home.allCategories")}
            actionHref={browsePath({ view: "categories" })}
          />
          <div className="bz-homecat-grid">
            {catalogLoading && !categories
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bz-cat__card" aria-hidden="true">
                    <div className="bz-cat__card-thumb skel" />
                    <span className="bz-cat__card-label">
                      <span className="skel" style={{ width: 54, height: 10, borderRadius: 6 }} />
                    </span>
                  </div>
                ))
              : (categories ?? []).map((c) => (
                  <CategoryTile
                    key={c.id}
                    c={c}
                    variant="card"
                    href={browsePath({ cat: c.id })}
                    onClick={() => nav("browse", { cat: c.id })}
                    shortOnMobile
                  />
                ))}
          </div>
        </W>

        {/* Flash Sale — mobile placement (after categories, per the revamp). */}
        <div className="bz-show-mobile">
          <W style={{ paddingTop: 24 }}>
            <FlashSaleMobile />
          </W>
        </div>

        <PicksSections
          newArrivals={homeData?.newArrivals}
          topPicks={homeData?.topPicks}
          homeLoading={homeLoading}
        />

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
            actionHref={searchPath()}
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
            actionHref={searchPath()}
          />
          {loading ? (
            <SkeletonRail cols={5} />
          ) : (
            <ProductRail items={madeInNepal} onOpen={openProduct} cols={5} />
          )}
        </W> */}

        {/* Endless product feed — shown on both web and mobile */}
        <W className="bz-home-section" style={{ paddingTop: 28 }}>
          <SectionHead title={t("home.moreToExplore")} />
          {isError && !homeLoading ? (
            <EmptyState
              title={t("home.loadError")}
              message={t("home.loadErrorMessage")}
              cta={t("common.reload")}
              onCta={() => window.location.reload()}
            />
          ) : (
            <>
              <div className="bz-picks-grid">
                {homeLoading && exploreFeed.items.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : exploreFeed.items.map((p) => (
                      <ProductCard key={p.id} p={p} onClick={openProduct} />
                    ))}
              </div>
              {!homeLoading && exploreFeed.total > 0 && (
                <LoadMore
                  paged={{
                    visible: exploreFeed.items,
                    shown: exploreFeed.items.length,
                    total: exploreFeed.total,
                    pageSize: exploreFeed.pageSize,
                    hasMore: exploreFeed.hasNextPage,
                    nextBatch: Math.min(
                      exploreFeed.pageSize,
                      Math.max(0, exploreFeed.total - exploreFeed.items.length),
                    ),
                    page: exploreFeed.page,
                    pageCount: Math.max(1, exploreFeed.totalPages),
                    more: () => {
                      void exploreFeed.loadMore();
                    },
                    goPage: () => {},
                    reset: () => {},
                  }}
                  noun="products"
                  size="sm"
                  style={{ paddingBottom: 12 }}
                />
              )}
            </>
          )}
        </W>
      </div>
    </>
  );
}
