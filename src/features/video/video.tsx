"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { formatNPR } from "@/lib/money";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  RatingStars,
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
  TINTS,
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
  AppLink,
} from "@/components/ui";
import { pathFromScreen, productShareUrl, searchPath } from "@/config/routes";
import { useVideoFeed } from "@/hooks/use-video-feed";
import { useVideoLike } from "@/hooks/use-video-like";
import { videosApi } from "@/services/api/videos";
import type { VideoFeedItem } from "@/types/video";
import type { Product } from "@/types";
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
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    setM(mq.matches);
    const h = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return m;
}

// A video feed item carries the full product shape the storefront needs (id,
// price, media, etc.) and just nests richer seller/engagement data on top. Cart
// and PDP handoffs read only the shared product fields, so present one as a Product.
const asProduct = (item: VideoFeedItem): Product => item as unknown as Product;

function fmtCount(n: number | string) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "0";
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}

/* ---- side action rail button ---- */
function ReelAction({
  icon,
  label,
  count,
  active,
  onClick,
  danger,
  inside,
}: {
  icon: string;
  label: string;
  count?: number | null;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  danger?: boolean;
  inside?: boolean;
}) {
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

function ReelThumb({
  v,
  active,
  onClick,
}: {
  v: VideoFeedItem;
  active?: boolean;
  onClick?: () => void;
}) {
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
  liked,
  onToggleLike,
  muted,
  onMutedChange,
  radius,
  hideMuteBadge,
}: {
  item: VideoFeedItem;
  isMobile: boolean;
  isActive: boolean;
  liked: boolean;
  onToggleLike: (videoId: string) => void;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
  radius?: string;
  hideMuteBadge?: boolean;
}) {
  const { openProduct, addToCart, toggleWish, wish, toast } = useBz();
  const p = item;
  const s = item.seller;
  const wished = wish.includes(p.id);
  const metrics = item.engagement;
  const caption = item.caption;
  const tint = TINTS[p.tint as keyof typeof TINTS] || TINTS.blue;

  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [capExpand, setCapExpand] = useState(false);
  const [fastFwd, setFastFwd] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const lastTap = useRef(0);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);

  const spawnBurst = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, { id, x, y }]);
    setTimeout(() => setBursts((b) => b.filter((h) => h.id !== id)), 900);
  };

  const onStageTap = (e: React.MouseEvent) => {
    if (wasLongPress.current) {
      wasLongPress.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 300 && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      if (!liked) onToggleLike(p.id);
      spawnBurst(x, y);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const onPointerDown = () => {
    longPressRef.current = setTimeout(() => {
      setFastFwd(true);
      wasLongPress.current = true;
    }, 400);
  };

  const onPointerUp = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (fastFwd) setFastFwd(false);
  };

  return (
    <div
      ref={stageRef}
      onClick={onStageTap}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius || 0,
        overflow: "hidden",
        boxShadow: isMobile ? "none" : "0 24px 80px rgba(0,0,0,.5)",
        background: "var(--ink-900)",
        touchAction: "pan-y",
      }}
    >
      {fastFwd && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(0,0,0,.65)",
            padding: "10px 20px",
            borderRadius: "var(--r-full)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}
        >
          <Icon name="fastForward" size={18} color="#fff" />
          2x Speed
        </div>
      )}
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
        publicId={p.videoPublicId}
        externalMuted={muted}
        onMutedChange={onMutedChange}
        playbackRate={fastFwd ? 2.0 : 1.0}
        isActive={isActive}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onMutedChange) onMutedChange(!muted);
          }}
          aria-label={muted ? "Unmute" : "Mute"}
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
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Icon name={muted ? "mute" : "volume"} size={18} />
        </button>
      )}

      {/* product mini-pill */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          openProduct(asProduct(p));
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
            {formatNPR(p.price)}
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
          <AppLink
            href={pathFromScreen("pdp", p.id)}
            onNavigate={() => openProduct(asProduct(p))}
            ariaLabel={`Visit ${s.name}`}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              padding: 0,
              border: "2px solid #fff",
              background: tint[2],
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
              textDecoration: "none",
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
          </AppLink>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: ".9375rem",
                textShadow: "0 1px 2px rgba(0,0,0,.5)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.name}
            </span>
          </div>
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
          count={metrics.likes + (liked ? 1 : 0)}
          active={liked}
          danger
          inside={isMobile}
          onClick={() => {
            onToggleLike(p.id);
            spawnBurst(160, 240);
          }}
        />
        {asProduct(p).allowBargaining && (
          <ReelAction
            icon="bargain"
            label="Bargain & ask"
            count={metrics.comments}
            inside={isMobile}
            onClick={() => {
              toast("Opening bargain chat…");
              openProduct(asProduct(p));
            }}
          />
        )}
        <ReelAction
          icon="share"
          label="Share"
          count={metrics.shares}
          inside={isMobile}
          onClick={() => {
            const url = productShareUrl(p.id);
            if (navigator.share) {
              navigator.share({ title: p.name, url }).catch(() => {});
            } else {
              navigator.clipboard
                .writeText(url)
                .then(() => toast("Link copied!"))
                .catch(() => {});
            }
          }}
        />
        <ReelAction
          icon="tag"
          label="Save"
          count={metrics.saves}
          active={wished}
          inside={isMobile}
          onClick={() => toggleWish(p.id)}
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
  const { openProduct, addToCart, toggleWish, wish, toast, nav, authed, promptLogin } = useBz();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startProductId = searchParams.get("product")?.trim() ?? null;
  const likeMutation = useVideoLike();
  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else nav("home");
  }, [router, nav]);
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: feed, isLoading, isError, error } = useVideoFeed();
  const vids: VideoFeedItem[] = (feed?.items ?? []).filter(
    (v) => typeof v.videoUrl === "string" && v.videoUrl.trim().length > 0,
  );
  const [liked, setLiked] = useState<Set<string>>(() => new Set());

  // Seed liked state from the server feed (reflects the signed-in user's likes).
  useEffect(() => {
    setLiked(new Set((feed?.items ?? []).filter((v) => v.liked).map((v) => v.id)));
  }, [feed]);

  const toggleLike = useCallback(
    (videoId: string) => {
      if (!authed) {
        promptLogin("Please sign in to like videos.");
        return;
      }
      const wasLiked = liked.has(videoId);
      setLiked((prev) => {
        const n = new Set(prev);
        wasLiked ? n.delete(videoId) : n.add(videoId);
        return n;
      });
      likeMutation.mutate(
        { videoId, like: !wasLiked },
        {
          onError: () => {
            setLiked((prev) => {
              const n = new Set(prev);
              wasLiked ? n.add(videoId) : n.delete(videoId);
              return n;
            });
          },
        },
      );
    },
    [authed, liked, likeMutation, promptLogin],
  );
  const [muted, setMuted] = useState(true);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wheelLock = useRef(0);
  const programmaticScroll = useRef(false);
  const initialProductScrollDone = useRef(false);

  const safeIndex = vids.length ? Math.min(activeIndex, vids.length - 1) : 0;
  const p = vids[safeIndex];
  const s = p?.seller;
  const tint = TINTS[p?.tint as keyof typeof TINTS] || TINTS.blue;
  const caption = p?.caption ?? "";
  const activeProductId = p?.id;

  useEffect(() => {
    initialProductScrollDone.current = false;
  }, [startProductId]);

  // Deep-link from PDP: open the requested product's reel, then user can scroll on.
  useEffect(() => {
    if (!startProductId || isLoading || vids.length === 0 || initialProductScrollDone.current) {
      return;
    }
    const idx = vids.findIndex((v) => v.id === startProductId);
    if (idx < 0) return;
    initialProductScrollDone.current = true;
    setActiveIndex(idx);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = idx * el.clientHeight;
    });
  }, [startProductId, isLoading, vids]);

  useEffect(() => {
    if (vids.length > 0 && activeIndex >= vids.length) setActiveIndex(0);
  }, [vids.length, activeIndex]);

  useEffect(() => {
    const current = vids[activeIndex];
    if (!current) return;
    const timer = setTimeout(() => {
      videosApi.recordView(current.id).catch(() => {});
    }, 10_000);
    return () => clearTimeout(timer);
  }, [activeIndex, vids]);

  // Scroll programmatically to a target reel index (smooth)
  const scrollToIndex = useCallback(
    (idx: number) => {
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
        let best: IntersectionObserverEntry | null = null;
        for (const en of entries) {
          if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
        }
        if (best && best.intersectionRatio >= 0.6) {
          const idx = parseInt((best.target as HTMLElement).dataset.reelIdx ?? "0", 10);
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
    const onWheel = (e: WheelEvent) => {
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
    const h = (e: KeyboardEvent) => {
      if (e.target && /input|textarea/i.test((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
      else if (e.key.toLowerCase() === "l" && activeProductId) {
        toggleLike(activeProductId);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [activeIndex, scrollToIndex, activeProductId, toggleLike]);

  /* ---- snap-scroll feed (renders all reels stacked) ---- */
  const reelFeed = (radius?: string) => (
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
            liked={liked.has(v.id)}
            onToggleLike={toggleLike}
            muted={muted}
            onMutedChange={setMuted}
            radius={radius || "0"}
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
        padding: 18,
        border: "1px solid var(--line-200)",
        boxShadow: "0 16px 48px rgba(0,0,0,.35)",
        overflow: "hidden",
        animation: "bz-slide-up .35s var(--ease) both",
      }}
    >
      {p.img && (
        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            marginBottom: 14,
            background: "var(--ink-50)",
          }}
        >
          <img
            src={p.img}
            alt={p.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <h2
        style={{
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 700,
          lineHeight: 1.3,
          color: "var(--blue-deep)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p.name}
      </h2>
      <div style={{ margin: "8px 0" }}>
        <Price value={p.price} original={p.original ?? undefined} size="lg" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <RatingStars value={p.rating} size={14} showVal count={p.reviews} />
      </div>
      {caption && (
        <p
          style={{
            color: "var(--ink-500)",
            fontSize: ".8125rem",
            lineHeight: 1.4,
            margin: "0 0 12px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {caption}
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button
          variant="primary"
          size="md"
          full
          icon="cart"
          onClick={() => void addToCart(asProduct(p), 1, "Added from video")}
        >
          Add to Cart
        </Button>
        <Button
          variant="ghost"
          size="sm"
          full
          iconRight="arrowRight"
          href={pathFromScreen("pdp", p.id)}
          onNavigate={() => openProduct(asProduct(p))}
        >
          View product
        </Button>
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
      <AppLink
        href={pathFromScreen("pdp", p.id)}
        onNavigate={() => openProduct(asProduct(p))}
        ariaLabel="Open product details"
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
          textDecoration: "none",
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
            {formatNPR(p.price)}
            {p.original && (
              <span
                style={{
                  marginLeft: 6,
                  color: "rgba(255,255,255,.55)",
                  textDecoration: "line-through",
                  fontWeight: 500,
                }}
              >
                {formatNPR(p.original)}
              </span>
            )}
          </span>
        </span>
      </AppLink>
      <Button
        variant="primary"
        size="md"
        icon="cart"
        onClick={() => void addToCart(asProduct(p), 1, "Added from video")}
      >
        Add
      </Button>
    </div>
  );

  /* ============================================================
     LAYOUT
     ============================================================ */
  if (isLoading || isError) {
    return (
      <ApiState isLoading={isLoading} isError={isError} error={error}>
        <div className="bz-video-theater" style={{ minHeight: 320 }} />
      </ApiState>
    );
  }

  if (vids.length === 0) {
    return (
      <div className="bz-video-theater">
        <div className="bz-video-theater__header">
          <button
            onClick={goBack}
            aria-label="Back"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,.12)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="chevronLeft" size={22} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 28px 28px",
          }}
        >
          <EmptyState
            dark
            title="No videos yet"
            message="When sellers add product videos, they appear here."
            cta="Browse products"
            ctaHref={searchPath()}
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
            onClick={goBack}
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
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.0625rem",
            }}
          >
            <Icon name="video" size={18} color="#ff6b75" /> Watch
          </span>
        </div>

        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>{reelFeed("0")}</div>

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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={goBack}
              aria-label="Back"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="chevronLeft" size={22} />
            </button>
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
          </div>
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
