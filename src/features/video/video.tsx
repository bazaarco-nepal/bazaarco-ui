"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  TINTS,
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
import { useVideoFeed } from "@/hooks/use-video-feed";
import type { VideoFeedItem, VideoFeedTab } from "@/types/video";
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

function useIsMobile(bp = 768) {
  const [m, setM] = useState(
    typeof window !== "undefined" && window.matchMedia(`(max-width:${bp}px)`).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const h = (e) => setM(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", h);
    else mq.addListener(h);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", h);
      else mq.removeListener(h);
    };
  }, [bp]);
  return m;
}

function fmtCount(n) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "0";
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}

const REEL_TABS: { id: VideoFeedTab; en: string; live?: boolean }[] = [
  { id: "foryou", en: "For You" },
  { id: "following", en: "Following" },
  { id: "nepal", en: "Made in Nepal" },
  { id: "flash", en: "Flash Deals" },
  { id: "live", en: "Live", live: true },
];

const TAB_EMPTY: Partial<Record<VideoFeedTab, { title: string; message: string }>> = {
  following: {
    title: "No followed sellers yet",
    message: "Follow shops from product pages — their videos will show here.",
  },
  live: { title: "No live streams right now", message: "Check back later or browse For You." },
  nepal: { title: "No Made in Nepal videos", message: "Try For You to see all product clips." },
  flash: {
    title: "No flash-deal videos",
    message: "Sale clips appear when sellers mark items on discount.",
  },
};

/* ---- side action rail button ---- */
function ReelAction({ icon, label, count, active, onClick, danger, inside }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        minWidth: 48,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(e);
        }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        aria-label={label}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          background: inside
            ? hov
              ? "rgba(255,255,255,.22)"
              : "rgba(255,255,255,.14)"
            : hov
              ? "rgba(255,255,255,.18)"
              : "rgba(255,255,255,.08)",
          color: active && danger ? "var(--red)" : "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition:
            "background var(--dur-standard) var(--ease), transform var(--dur-fast) var(--ease)",
          transform: active ? "scale(1.06)" : "scale(1)",
          backdropFilter: inside ? "blur(4px)" : "none",
        }}
      >
        <Icon name={icon} size={24} fill={active && danger ? "currentColor" : "none"} />
      </button>
      {count != null && (
        <span
          className="tnum"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,.6)",
            letterSpacing: ".02em",
            lineHeight: 1,
          }}
        >
          {fmtCount(count)}
        </span>
      )}
    </div>
  );
}

function EqBars({ size = 12, color = "#fff", playing = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: size }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: size,
            background: color,
            borderRadius: 1,
            transformOrigin: "bottom",
            animation: playing
              ? `bz-eq ${0.7 + i * 0.15}s ease-in-out ${i * 0.07}s infinite`
              : "none",
          }}
        />
      ))}
    </span>
  );
}

function ReelThumb({ v, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Watch ${v.name}`}
      style={{
        padding: 0,
        border: `2px solid ${active ? "var(--red)" : "transparent"}`,
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        cursor: "pointer",
        background: "none",
        position: "relative",
        flexShrink: 0,
        width: "100%",
        aspectRatio: "9 / 14",
        boxShadow: active ? "0 0 0 4px rgba(230,57,70,.25)" : "none",
        transition: "box-shadow var(--dur-standard) var(--ease)",
      }}
    >
      {v.img ? (
        <img
          src={v.img}
          alt={v.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Placeholder
          icon={v.icon}
          tint={v.tint}
          radius="0"
          style={{ position: "absolute", inset: 0 }}
        />
      )}
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: active
            ? "linear-gradient(transparent 55%, rgba(0,0,0,.55))"
            : "linear-gradient(transparent 60%, rgba(0,0,0,.4))",
        }}
      />
      {!active && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="play" size={18} color="#fff" fill="#fff" />
        </span>
      )}
      <span
        style={{
          position: "absolute",
          left: 6,
          right: 6,
          bottom: 6,
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1.2,
          textShadow: "0 1px 2px rgba(0,0,0,.6)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {v.name}
      </span>
    </button>
  );
}

/* ============================================================
   ReelItem — single reel rendered inside the snap-scroll container
   ============================================================ */
function ReelItem({
  item,
  isMobile,
  isActive,
  follows,
  onToggleFollow,
  muted,
  radius,
  hideMuteBadge,
}) {
  const { openProduct, addToCart, toggleWish, wish, toast } = useBz();
  const p = item;
  const s = item.seller;
  const wished = wish.includes(p.id);
  const followed = follows.has(s.id);
  const metrics = item.engagement;
  const caption = item.caption;
  const tags = item.hashtags;
  const tint = TINTS[p.tint] || TINTS.blue;

  const [bursts, setBursts] = useState([]);
  const [capExpand, setCapExpand] = useState(false);
  const stageRef = useRef(null);
  const lastTap = useRef(0);

  const spawnBurst = (x, y) => {
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, { id, x, y }]);
    setTimeout(() => setBursts((b) => b.filter((h) => h.id !== id)), 900);
  };

  const onStageTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const rect = stageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      if (!wished) toggleWish(p.id);
      spawnBurst(x, y);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  return (
    <div
      ref={stageRef}
      onClick={onStageTap}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius || 0,
        overflow: "hidden",
        boxShadow: isMobile ? "none" : "0 24px 80px rgba(0,0,0,.5)",
        background: "var(--ink-900)",
      }}
    >
      <VideoPlayer
        key={p.id}
        tint={p.tint}
        icon={p.icon}
        fill
        radius="0"
        autoplay
        compact
        label={false}
        thumb={p.videoThumb}
        src={p.videoUrl}
      />

      {/* index pill */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          zIndex: 3,
          background: "rgba(0,0,0,.45)",
          color: "#fff",
          padding: "5px 10px",
          borderRadius: "var(--r-full)",
          fontSize: 11,
          fontWeight: 700,
          backdropFilter: "blur(4px)",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
        className="tnum"
      >
        <Icon name="video" size={12} color="#fff" />
        {fmtCount(metrics.views)} views
      </div>

      {!hideMuteBadge && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 3,
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(0,0,0,.45)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          <Icon name={muted ? "mute" : "volume"} size={18} />
        </div>
      )}

      {/* product mini-pill */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          openProduct(p);
        }}
        style={{
          position: "absolute",
          left: 14,
          top: 56,
          zIndex: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,.95)",
          borderRadius: "var(--r-full)",
          padding: "5px 12px 5px 5px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,.25)",
          maxWidth: "75%",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            background: `linear-gradient(145deg, ${tint[0]}, ${tint[1]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {p.img ? (
            <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Icon name={p.icon} size={16} color={tint[2]} />
          )}
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-700)",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 160,
            }}
          >
            {p.name}
          </span>
          <span
            className="tnum"
            style={{ fontSize: 12, fontWeight: 800, color: "var(--red)", lineHeight: 1.1 }}
          >
            Rs.&nbsp;{p.price.toLocaleString("en-IN")}
          </span>
        </span>
        <Icon name="arrowRight" size={14} color="var(--ink-500)" />
      </button>

      {/* caption block */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 14,
          right: isMobile ? 78 : 14,
          bottom: 26,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          color: "#fff",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <button
            onClick={() => openProduct(p)}
            aria-label={`Visit ${s.name}`}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              padding: 0,
              border: "2px solid #fff",
              background: TINTS[s.tint][2],
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {s.avatar ? (
              <img
                src={s.avatar}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              s.name[0]
            )}
            {!followed && (
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -6,
                  transform: "translateX(-50%)",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--red)",
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="plus" size={11} color="#fff" stroke={2.5} />
              </span>
            )}
          </button>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: ".9375rem",
                  textShadow: "0 1px 2px rgba(0,0,0,.5)",
                }}
              >
                @{s.id}
              </span>
              {s.verified && <Icon name="badgeCheck" size={14} color="var(--gold)" />}
            </div>
            <span
              style={{ fontSize: ".75rem", opacity: 0.85, textShadow: "0 1px 2px rgba(0,0,0,.5)" }}
            >
              {s.name} · {s.city}
            </span>
          </div>
          <button
            onClick={() => onToggleFollow(s.id)}
            style={{
              marginLeft: "auto",
              height: 30,
              padding: "0 12px",
              border: followed ? "1px solid rgba(255,255,255,.5)" : "none",
              borderRadius: "var(--r-md)",
              cursor: "pointer",
              fontSize: ".8125rem",
              fontWeight: 700,
              background: followed ? "transparent" : "#fff",
              color: followed ? "#fff" : "var(--ink-900)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {followed ? (
              <>
                <Icon name="check" size={13} /> Following
              </>
            ) : (
              "Follow"
            )}
          </button>
        </div>

        <div style={{ pointerEvents: "auto", maxWidth: "100%" }}>
          <p
            style={{
              margin: 0,
              fontSize: ".875rem",
              lineHeight: 1.45,
              color: "#fff",
              textShadow: "0 1px 2px rgba(0,0,0,.55)",
              display: "-webkit-box",
              WebkitLineClamp: capExpand ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {caption}
          </p>
          {caption.length > 90 && (
            <button
              onClick={() => setCapExpand((x) => !x)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,.85)",
                fontSize: ".75rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 0",
              }}
            >
              {capExpand ? "less" : "more"}
            </button>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: ".75rem",
                  color: "#fff",
                  opacity: 0.9,
                  fontWeight: 600,
                  textShadow: "0 1px 2px rgba(0,0,0,.5)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "auto",
            background: "rgba(0,0,0,.35)",
            padding: "5px 10px",
            borderRadius: "var(--r-full)",
            backdropFilter: "blur(4px)",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          <Icon name="headphones" size={14} color="#fff" />
          <span
            style={{
              fontSize: ".75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 180,
            }}
          >
            Original sound · {s.name}
          </span>
          <EqBars size={11} playing={isActive} />
        </div>
      </div>

      {/* action rail */}
      <div
        style={{
          position: "absolute",
          right: isMobile ? 10 : -68,
          bottom: isMobile ? 200 : 90,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          alignItems: "center",
          zIndex: 4,
        }}
      >
        <ReelAction
          icon="heart"
          label="Like"
          count={metrics.likes + (wished ? 1 : 0)}
          active={wished}
          danger
          inside={isMobile}
          onClick={() => {
            toggleWish(p.id);
            spawnBurst(160, 240);
          }}
        />
        <ReelAction
          icon="bargain"
          label="Bargain & ask"
          count={metrics.comments}
          inside={isMobile}
          onClick={() => {
            toast("Opening bargain chat…");
            openProduct(p);
          }}
        />
        <ReelAction
          icon="share"
          label="Share"
          count={metrics.shares}
          inside={isMobile}
          onClick={() => toast("Link copied to clipboard")}
        />
        <ReelAction
          icon="tag"
          label="Save"
          count={metrics.saves}
          inside={isMobile}
          onClick={() => toast("Saved to your collection")}
        />
      </div>

      {/* heart-burst layer */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 6 }}>
        {bursts.map((b) => (
          <Icon
            key={b.id}
            name="heart"
            size={88}
            color="var(--red)"
            fill="var(--red)"
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              transform: "translate(-50%,-50%)",
              animation: "bz-heart-pop .9s ease-out forwards",
              filter: "drop-shadow(0 6px 16px rgba(230,57,70,.5))",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   VideoTheater — orchestrator + snap scroll container
   ============================================================ */
export function VideoTheater() {
  const { openProduct, addToCart, toggleWish, wish, toast, nav } = useBz();
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState<VideoFeedTab>("foryou");
  const { data: feed, isLoading, isError, error } = useVideoFeed(tab);
  const vids: VideoFeedItem[] = feed?.items ?? [];
  const [follows, setFollows] = useState(() => new Set());
  const [muted, setMuted] = useState(true);
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const wheelLock = useRef(0);
  const programmaticScroll = useRef(false);

  const safeIndex = vids.length ? Math.min(activeIndex, vids.length - 1) : 0;
  const p = vids[safeIndex];
  const s = p?.seller;
  const tint = TINTS[p?.tint] || TINTS.blue;
  const caption = p?.caption ?? "";
  const activeProductId = p?.id;

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  useEffect(() => {
    if (vids.length > 0 && activeIndex >= vids.length) setActiveIndex(0);
  }, [vids.length, activeIndex]);

  const toggleFollow = (sellerId) => {
    setFollows((set) => {
      const n = new Set(set);
      const has = n.has(sellerId);
      has ? n.delete(sellerId) : n.add(sellerId);
      toast(has ? "Unfollowed" : `Following ${p?.seller?.name ?? "seller"}`);
      return n;
    });
  };

  // Scroll programmatically to a target reel index (smooth)
  const scrollToIndex = useCallback(
    (idx) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(vids.length - 1, idx));
      programmaticScroll.current = true;
      el.scrollTo({ top: clamped * el.clientHeight, behavior: "smooth" });
      setTimeout(() => {
        programmaticScroll.current = false;
      }, 600);
    },
    [vids.length],
  );

  // Active-reel detection via IntersectionObserver
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const items = root.querySelectorAll("[data-reel-idx]");
    const io = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const en of entries) {
          if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
        }
        if (best && best.intersectionRatio >= 0.6) {
          const idx = parseInt(best.target.dataset.reelIdx, 10);
          setActiveIndex(idx);
        }
      },
      { root, threshold: [0.4, 0.6, 0.8, 1] },
    );
    items.forEach((it) => io.observe(it));
    return () => io.disconnect();
  }, [vids.length, isMobile]);

  // Wheel: intercept on desktop for discrete next/prev with smooth scroll
  useEffect(() => {
    if (isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 10) return;
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock.current < 520) return;
      wheelLock.current = now;
      scrollToIndex(activeIndex + (e.deltaY > 0 ? 1 : -1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [activeIndex, isMobile, scrollToIndex]);

  // Keyboard: arrows + j/k navigate, m toggles mute, l likes active product
  useEffect(() => {
    const h = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
      else if (e.key.toLowerCase() === "l" && activeProductId) {
        if (!wish.includes(activeProductId)) toggleWish(activeProductId);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [activeIndex, scrollToIndex, activeProductId, wish, toggleWish]);

  /* ---- top filter chip row ---- */
  const tabsRow = (
    <div
      className="bz-reel-chip-row"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: isMobile ? "0 12px" : 0,
        scrollbarWidth: "none",
      }}
    >
      {REEL_TABS.map((tb) => {
        const active = tb.id === tab;
        return (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-full)",
              border: "none",
              cursor: "pointer",
              background: active ? "#fff" : "rgba(255,255,255,.12)",
              color: active ? "var(--ink-900)" : "rgba(255,255,255,.88)",
              fontWeight: 700,
              fontSize: ".8125rem",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              transition: "background var(--dur-standard) var(--ease)",
            }}
          >
            {tb.live && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--red)",
                  boxShadow: "0 0 0 2px rgba(230,57,70,.35)",
                }}
              />
            )}
            {tb.en}
          </button>
        );
      })}
    </div>
  );

  /* ---- snap-scroll feed (renders all reels stacked) ---- */
  const reelFeed = (radius) => (
    <div
      ref={scrollRef}
      className="bz-reel-feed"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
        borderRadius: radius || 0,
        WebkitOverflowScrolling: "touch",
        background: "var(--ink-900)",
      }}
    >
      {vids.map((v, idx) => (
        <div
          key={v.id}
          data-reel-idx={idx}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            scrollSnapAlign: "start",
            scrollSnapStop: "always",
          }}
        >
          <ReelItem
            item={v}
            isMobile={isMobile}
            isActive={idx === activeIndex}
            follows={follows}
            onToggleFollow={toggleFollow}
            muted={muted}
            radius={radius || 0}
            hideMuteBadge={!isMobile}
          />
        </div>
      ))}
    </div>
  );

  /* ---- global mute toggle (overlay top-right of stage, desktop) ---- */
  const globalMute = (
    <button
      onClick={() => setMuted((m) => !m)}
      aria-label={muted ? "Unmute" : "Mute"}
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 10,
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: "none",
        background: "rgba(0,0,0,.55)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <Icon name={muted ? "mute" : "volume"} size={18} />
    </button>
  );

  /* ---- desktop chevron nav (outside stage) ---- */
  const navButtons = !isMobile && (
    <>
      <button
        onClick={() => scrollToIndex(activeIndex - 1)}
        aria-label="Previous reel (↑)"
        style={{
          position: "absolute",
          left: "50%",
          top: 10,
          transform: "translateX(-50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,.16)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        }}
      >
        <Icon name="chevronDown" size={20} style={{ transform: "rotate(180deg)" }} />
      </button>
      <button
        onClick={() => scrollToIndex(activeIndex + 1)}
        aria-label="Next reel (↓)"
        style={{
          position: "absolute",
          left: "50%",
          bottom: 44,
          transform: "translateX(-50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,.16)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        }}
      >
        <Icon name="chevronDown" size={20} />
      </button>
    </>
  );

  /* ---- right product detail panel (desktop) ---- */
  const productPanel = p && s && (
    <div
      key={p.id}
      className="bz-video-panel"
      style={{
        background: "#fff",
        borderRadius: "var(--r-xl)",
        padding: 22,
        border: "1px solid var(--line-200)",
        boxShadow: "0 16px 48px rgba(0,0,0,.35)",
        maxHeight: "min(680px, calc(100dvh - 200px))",
        overflowY: "auto",
        animation: "bz-slide-up .35s var(--ease) both",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <Chip tone="red" icon="video">
          Featured in video
        </Chip>
        {p.original && <Chip tone="saffron">-{Math.round((1 - p.price / p.original) * 100)}%</Chip>}
        {s.verified && (
          <Chip tone="gold" icon="badgeCheck">
            Verified seller
          </Chip>
        )}
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: "1.25rem",
          fontWeight: 700,
          lineHeight: 1.3,
          color: "var(--blue-deep)",
        }}
      >
        {p.name}
      </h2>
      <div className="ne" style={{ color: "var(--ink-400)", fontSize: ".875rem", marginTop: 3 }}>
        {p.ne}
      </div>
      <div style={{ margin: "14px 0" }}>
        <Price value={p.price} original={p.original} size="lg" />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 14,
          borderBottom: "1px solid var(--line-200)",
        }}
      >
        <RatingStars value={p.rating} size={15} showVal count={p.reviews} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
        <Chip tone="blue" icon="truck">
          By {p.eta}
        </Chip>
        <Chip tone="success" icon="returns">
          7-day returns
        </Chip>
        <Chip tone="neutral" icon="wallet">
          Cash on delivery
        </Chip>
      </div>
      <p
        style={{
          color: "var(--ink-500)",
          fontSize: ".875rem",
          lineHeight: 1.6,
          margin: "0 0 18px",
        }}
      >
        {caption}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button
          variant="primary"
          size="lg"
          full
          icon="cart"
          onClick={() => {
            addToCart(p, 1);
            toast("Added from video");
          }}
        >
          Add to Cart
        </Button>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" full icon="bargain" onClick={() => openProduct(p)}>
            Bargain
          </Button>
          <Button variant="ghost" full iconRight="arrowRight" onClick={() => openProduct(p)}>
            Full details
          </Button>
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
          color: "var(--ink-400)",
          fontSize: ".75rem",
        }}
      >
        <Icon name="lock" size={14} color="var(--ink-400)" /> Secure payment · all payment options
      </div>
    </div>
  );

  /* ---- mobile sticky add-to-cart bar ---- */
  const mobileCartBar = isMobile && p && (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "rgba(11,18,32,.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,.1)",
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <button
        onClick={() => openProduct(p)}
        aria-label="Open product details"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          flex: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            flexShrink: 0,
            background: `linear-gradient(145deg, ${tint[0]}, ${tint[1]})`,
          }}
        >
          {p.img && (
            <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: ".8125rem",
              fontWeight: 700,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 180,
            }}
          >
            {p.name}
          </span>
          <span className="tnum" style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
            Rs.&nbsp;{p.price.toLocaleString("en-IN")}
            {p.original && (
              <span
                style={{
                  marginLeft: 6,
                  color: "rgba(255,255,255,.55)",
                  textDecoration: "line-through",
                  fontWeight: 500,
                }}
              >
                Rs.&nbsp;{p.original.toLocaleString("en-IN")}
              </span>
            )}
          </span>
        </span>
      </button>
      <Button
        variant="primary"
        size="md"
        icon="cart"
        onClick={() => {
          addToCart(p, 1);
          toast("Added from video");
        }}
      >
        Add
      </Button>
    </div>
  );

  /* ============================================================
     LAYOUT
     ============================================================ */
  const emptyCopy = TAB_EMPTY[tab];

  if (isLoading || isError) {
    return (
      <ApiState isLoading={isLoading} isError={isError} error={error}>
        <div className="bz-video-theater" style={{ minHeight: 320 }} />
      </ApiState>
    );
  }

  if (vids.length === 0) {
    return (
      <div className="bz-video-theater" style={{ padding: "28px" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}>{tabsRow}</div>
          <EmptyState
            title={emptyCopy?.title ?? "No videos yet"}
            message={emptyCopy?.message ?? "When sellers add product videos, they appear here."}
            cta="Browse products"
            onCta={() => nav("browse")}
          />
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div
        style={{
          background: "var(--ink-900)",
          height: "calc(100dvh - 68px)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            zIndex: 30,
            padding: "10px 0",
            background: "var(--ink-900)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() => nav("home")}
            aria-label="Back"
            style={{
              marginLeft: 12,
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,.55)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backdropFilter: "blur(4px)",
            }}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>{tabsRow}</div>
        </div>

        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>{reelFeed(0)}</div>

        {mobileCartBar}
      </div>
    );
  }

  /* ---- desktop ---- */
  return (
    <div className="bz-video-theater" style={{ position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.35,
          background: `radial-gradient(60% 50% at 50% 40%, ${tint[2]}66, transparent 70%)`,
          transition: "background var(--dur-slow) var(--ease)",
        }}
      />

      <div className="bz-video-theater__header" style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#ff6b75",
                fontWeight: 700,
                fontSize: ".8125rem",
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              <Icon name="video" size={16} color="#ff6b75" /> Watch
            </div>
            <h1 style={{ margin: "4px 0 0", color: "#fff", fontSize: "1.5rem", fontWeight: 800 }}>
              Watch, bargain, <span style={{ color: "#ff6b75" }}>buy</span>
            </h1>
          </div>
          <div style={{ flex: 1, minWidth: 280, maxWidth: 560 }}>{tabsRow}</div>
          <div
            style={{
              color: "rgba(255,255,255,.55)",
              fontSize: ".75rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <kbd style={kbd}>↑</kbd>
              <kbd style={kbd}>↓</kbd> swipe
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <kbd style={kbd}>L</kbd> like
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <kbd style={kbd}>M</kbd> mute
            </span>
          </div>
        </div>
      </div>

      <div className="bz-video-theater__layout bz-stack-900" style={{ position: "relative" }}>
        {/* left: thumb rail */}
        <div
          className="bz-reel-thumbs bz-video-theater__thumbs"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {vids.map((v, idx) => (
            <ReelThumb
              key={v.id}
              v={v}
              active={idx === activeIndex}
              onClick={() => scrollToIndex(idx)}
            />
          ))}
        </div>

        {/* center: scroll-snap stage (9:16, fits viewport) */}
        <div className="bz-video-theater__stage-wrap">
          <div className="bz-video-theater__stage">
            {reelFeed("var(--r-xl)")}
            {globalMute}
            {navButtons}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 12,
                transform: "translateX(-50%)",
                color: "rgba(255,255,255,.85)",
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                zIndex: 5,
                background: "rgba(0,0,0,.45)",
                padding: "4px 10px",
                borderRadius: 999,
                backdropFilter: "blur(6px)",
              }}
              className="tnum"
            >
              <span style={{ color: "#fff" }}>{activeIndex + 1}</span> / {vids.length}
            </div>
          </div>
        </div>

        {/* right: product detail panel */}
        {productPanel}
      </div>
    </div>
  );
}

const kbd = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 22,
  height: 22,
  padding: "0 5px",
  background: "rgba(255,255,255,.1)",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 4,
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, monospace)",
};
