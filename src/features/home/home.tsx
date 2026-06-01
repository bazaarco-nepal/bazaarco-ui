"use client";

import React, { useState, useEffect } from "react";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  RatingStars,
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
  HelpLifeline,
  AllInPriceCard,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  BottomNav,
  LandmarkAddress,
  VoiceMicButton,
  usePaged,
  usePages,
  LoadMore,
  PageBar,
  BackToTop,
  ApiState,
} from "@/components/ui";
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

// Single sponsored placement — one premium paid ad, no carousel.
function Hero() {
  const { nav } = useBz();
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
        background: "radial-gradient(130% 150% at 86% 50%, #eef0fc 0%, #e6ebfb 45%, #dde6f7 100%)",
      }}
    >
      {/* Sponsor disclosure — top-left, honest and unobtrusive */}
      <span
        style={{
          position: "absolute",
          top: 18,
          left: 24,
          zIndex: 3,
          fontSize: ".6875rem",
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--ink-400)",
        }}
      >
        Sponsored
      </span>

      {/* Copy — minimal, catchy */}
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
        <span
          style={{
            fontSize: ".8125rem",
            fontWeight: 700,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "var(--ink-500)",
            marginBottom: 10,
          }}
        >
          Samsung
        </span>
        <h1
          className="bz-hero-h1"
          style={{ margin: 0, fontWeight: 800, color: "var(--ink-900)", letterSpacing: "-.02em" }}
        >
          Galaxy S26 Ultra
        </h1>
        <p
          style={{
            color: "var(--ink-600)",
            fontSize: "1.0625rem",
            marginTop: 14,
            lineHeight: 1.5,
          }}
        >
          Now on BazaarCo. Pre-order &amp; save up to{" "}
          <strong style={{ color: "var(--ink-900)" }}>Rs 18,000</strong>.
        </p>
        <div style={{ marginTop: 30 }}>
          <Button
            variant="primary"
            size="lg"
            style={{ borderRadius: "var(--r-full)" }}
            iconRight="arrowRight"
            onClick={() => nav("browse")}
          >
            Shop now
          </Button>
        </div>
      </div>

      {/* Product — white-bg render blended onto light panel via multiply (drops the white box) */}
      <div
        className="bz-hero-art"
        style={{
          position: "relative",
          zIndex: 2,
          width: 480,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 40px",
        }}
      >
        <img
          src={ASSETS.promotions.sponsoredS26Ultra}
          alt="Samsung Galaxy S26 Ultra"
          style={{
            width: "100%",
            maxWidth: 400,
            height: "auto",
            objectFit: "contain",
            mixBlendMode: "multiply",
            filter: "drop-shadow(0 18px 40px rgba(40,40,80,.22))",
          }}
        />
      </div>
    </div>
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

function FeaturedSellers({ sellers }) {
  const { nav } = useBz();
  const list = Object.values(sellers ?? {})
    .filter((s) => s.verified)
    .slice(0, 5);
  // Curated section: cap columns to actual count so a short list never leaves a trailing empty track.
  return (
    <div
      className="bz-grid-cards"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(list.length, 5)},1fr)`,
        gap: 18,
      }}
    >
      {list.map((s) => (
        <div
          key={s.id}
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 22,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 12px",
              overflow: "hidden",
              border: "2px solid var(--line-200)",
            }}
          >
            <img
              src={s.avatar}
              alt={s.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: ".9375rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {s.name} <Icon name="badgeCheck" size={15} color="var(--gold)" />
          </div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
            <RatingStars value={s.rating} size={13} showVal count={s.reviews} />
          </div>
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="mapPin" size={12} color="var(--ink-400)" /> {s.city}
          </div>
          <div style={{ marginTop: 14 }}>
            <Button variant="secondary" size="sm" full onClick={() => nav("browse")}>
              Visit Store
            </Button>
          </div>
        </div>
      ))}
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
  const { nav, openProduct } = useBz();
  const user = useBazaarStore((s) => s.user);
  const { data: homeData, isLoading: homeLoading, isError: homeError, error: homeErr } = useHome();
  const catalog = useCatalog();
  const loading = homeLoading || catalog.isLoading;
  const isError = homeError || catalog.isError;
  const error = homeErr ?? catalog.error;
  const { products, categories, sellers, byId, videoProducts, flashProducts } = catalog;
  const trending = homeData?.trending?.length ? homeData.trending : [];
  const madeInNepal = homeData?.trending?.length ? homeData.trending.slice(0, 5) : [];
  const buyerGreeting = user ? displayName(user, "there") : null;
  const feedPaged = usePaged(
    products.filter((p) => !p.outOfStock),
    20,
  );
  const W = ({ children, style }) => (
    <section
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "0 28px", ...style }}
    >
      {children}
    </section>
  );
  return (
    <ApiState isLoading={loading} isError={isError} error={error}>
      <div style={{ paddingBottom: 8 }}>
        <BackToTop />
        {/* Desktop hero — hidden on phones */}
        <div className="bz-hide-mobile">
          <W style={{ paddingTop: 22 }}>
            <Hero />
          </W>
        </div>

        {/* Mobile-only compact greeting + offer banner */}
        <div className="bz-show-mobile">
          <W style={{ paddingTop: 14 }}>
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
                <span style={{ fontSize: 22 }}>🙏</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", fontWeight: 600 }}>
                  Namaste{buyerGreeting ? `, ${buyerGreeting.split(" ")[0]}` : ""}
                </div>
                <div style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--blue-deep)" }}>
                  Let's shop · किनमेल गरौं
                </div>
              </div>
            </div>
            <button
              onClick={() => nav("browse")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "linear-gradient(90deg, var(--tint-red-50), #fff)",
                border: "1.5px solid var(--red)",
                borderRadius: "var(--r-lg)",
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--r-md)",
                  background: "var(--red)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="gift" size={22} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: "var(--red)", fontSize: ".9375rem" }}>
                  Browse deals
                </div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  Verified sellers · fair prices
                </div>
              </div>
              <Icon name="arrowRight" size={18} color="var(--red)" />
            </button>
          </W>
        </div>

        {/* categories */}
        <W style={{ paddingTop: 24 }}>
          <SectionHead
            eyebrow="Browse"
            title="Shop by category"
            action="All categories"
            onAction={() => nav("browse")}
          />
          <div
            className="bz-cat-row no-scrollbar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {(categories ?? []).map((c) => (
              <CategoryTile key={c.id} c={c} onClick={() => nav("browse")} />
            ))}
          </div>
        </W>

        {/* flash sale */}
        <W style={{ paddingTop: 44 }}>
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
            <button
              onClick={() => nav("browse")}
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
              }}
            >
              View all <Icon name="arrowRight" size={16} />
            </button>
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
        </W>

        {/* trending in Kathmandu — hyperlocal */}
        <W style={{ paddingTop: 52 }}>
          <SectionHead
            eyebrow={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="mapPin" size={13} color="var(--red)" /> Trending in Kathmandu
              </span>
            }
            title="What your city is buying right now"
            action="See more"
            onAction={() => nav("browse")}
          />
          {loading ? (
            <SkeletonRail cols={5} />
          ) : (
            <ProductRail items={trending} onOpen={openProduct} cols={5} />
          )}
        </W>

        {/* video shopping rail — desktop only */}
        <div className="bz-hide-mobile">
          <W style={{ paddingTop: 52 }}>
            <div
              style={{
                background: "var(--blue-deep)",
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
                      color: "#ff6b75",
                      marginBottom: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="video" size={15} color="#ff6b75" /> Watch
                  </div>
                  <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                    See it in motion before you <span style={{ color: "#ff6b75" }}>buy</span>
                  </h2>
                </div>
                <Button variant="primary" onClick={() => nav("video")} iconRight="arrowRight">
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
        </div>

        {/* made in nepal */}
        <W style={{ paddingTop: 52, position: "relative" }}>
          <SectionHead
            eyebrow="Made in Nepal"
            title="Loved in Nepal"
            action="See more"
            onAction={() => nav("browse")}
          />
          {loading ? (
            <SkeletonRail cols={5} />
          ) : (
            <ProductRail items={madeInNepal} onOpen={openProduct} cols={5} />
          )}
        </W>

        {/* featured sellers — desktop only; Meesho-style buyer doesn't need seller browsing here */}
        <div className="bz-hide-mobile">
          <W style={{ paddingTop: 52 }}>
            <SectionHead
              eyebrow="Trusted stores"
              title="Featured"
              accent="sellers"
              action="All sellers"
              onAction={() => nav("browse")}
            />
            <FeaturedSellers sellers={sellers} />
          </W>
        </div>

        {/* Mobile-only: endless product feed */}
        <div className="bz-show-mobile">
          <W style={{ paddingTop: 28 }}>
            <SectionHead eyebrow="Just for you" title="More to explore" />
            <div
              className="bz-grid-cards"
              style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}
            >
              {feedPaged.visible.map((p) => (
                <ProductCard key={p.id} p={p} onClick={openProduct} />
              ))}
            </div>
            <LoadMore paged={feedPaged} noun="products" style={{ paddingBottom: 12 }} />
          </W>
        </div>
      </div>
    </ApiState>
  );
}
