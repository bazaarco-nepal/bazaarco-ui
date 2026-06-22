"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useVideoFeed } from "@/buyer/hooks/use-video-feed";
import { videosApi } from "@/buyer/api/videos";
import {
  PdpAddToCartButton,
  PdpMakeOfferButton,
  PdpViewProductLink,
  PdpWishlistButton,
} from "@/buyer/features/pdp/_components/product-actions";
import { AppLink, Button, EmptyState, Icon, IconButton } from "@/components/ui";
import { useBz } from "@/components/common";
import { useBazaarStore } from "@/store/bazaar-store";
import { pathFromScreen, productShareUrl, searchPath } from "@/config/routes";
import { queryKeys } from "@/shared/api/query-keys";
import { formatNPR } from "@/shared/lib/money";
import { toast } from "@/shared/lib/toast";
import type { Product } from "@/types";
import type { VideoFeedItem, VideoFeedResponse } from "@/types/video";

const asProduct = (item: VideoFeedItem): Product => item as unknown as Product;

function formatViews(value: number) {
  return `${value.toLocaleString("en-IN")} ${value === 1 ? "view" : "views"}`;
}

function discountPercent(item: VideoFeedItem) {
  if (!item.original || item.original <= item.price) return null;
  return Math.round(((item.original - item.price) / item.original) * 100);
}

function ProductRating({ item }: { item: VideoFeedItem }) {
  const reviewed = item.reviews > 0;
  return (
    <div
      className="watch__rating"
      aria-label={reviewed ? `${item.rating} out of 5` : "No reviews yet"}
    >
      <span className="watch__stars" data-empty={!reviewed} aria-hidden="true">
        ★★★★★
      </span>
      <span className="watch__rating-copy">
        {reviewed
          ? `${item.rating.toFixed(1)} (${item.reviews.toLocaleString("en-IN")})`
          : "No reviews yet"}
      </span>
    </div>
  );
}

function ProductImage({ item }: { item: VideoFeedItem }) {
  const src = item.img ?? item.videoThumb;
  return src ? (
    <img className="watch__media-img" src={src} alt={item.name} />
  ) : (
    <span className="watch__queue-play" aria-hidden="true">
      <Icon name={item.icon} size={32} />
    </span>
  );
}

function SellerAvatar({ item }: { item: VideoFeedItem }) {
  return (
    <span className="watch__avatar" aria-hidden="true">
      {item.seller.avatar ? (
        <img src={item.seller.avatar} alt="" />
      ) : (
        item.seller.name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}

function WatchQueueItem({
  item,
  active,
  onSelect,
}: {
  item: VideoFeedItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="watch__queue-card"
      data-active={active}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
    >
      <span className="watch__queue-thumb">
        <ProductImage item={item} />
        <span className="watch__queue-play" aria-hidden="true">
          <Icon name="play" size={18} fill="currentColor" />
        </span>
      </span>
      <span className="watch__queue-meta">
        <span className="watch__queue-name">{item.name}</span>
        <span className="watch__queue-store">{item.seller.name}</span>
      </span>
    </button>
  );
}

function ShopActions({ item, size = "lg" }: { item: VideoFeedItem; size?: "md" | "lg" }) {
  const product = asProduct(item);
  return (
    <>
      <PdpAddToCartButton product={product} size={size} />
      <PdpMakeOfferButton product={product} size={size} />
      <PdpWishlistButton product={product} size={size} />
      <PdpViewProductLink product={product} />
    </>
  );
}

function ProductSummary({ item }: { item: VideoFeedItem }) {
  const discount = discountPercent(item);
  return (
    <>
      <div className="watch__product-name">{item.name}</div>
      <div className="watch__price-row">
        <span className="watch__price">{formatNPR(item.price)}</span>
        {item.original && item.original > item.price ? (
          <>
            <span className="watch__price-was">{formatNPR(item.original)}</span>
            <span className="watch__discount">-{discount}%</span>
          </>
        ) : null}
      </div>
      <ProductRating item={item} />
    </>
  );
}

function ShopPanel({ item }: { item: VideoFeedItem }) {
  return (
    <aside className="watch__shop">
      <p className="watch__shop-eyebrow">Shop this video</p>
      <div className="watch__media">
        <ProductImage item={item} />
      </div>
      <div className="watch__shop-body">
        <ProductSummary item={item} />
        <div className="watch__actions">
          <ShopActions item={item} />
        </div>
        <div className="watch__shop-seller">
          <SellerAvatar item={item} />
          <div className="watch__seller-copy">
            <strong>{item.seller.name}</strong>
            <span>Seller</span>
          </div>
          <Button variant="link" href={item.seller.url} iconRight="arrowRight">
            Visit store
          </Button>
        </div>
      </div>
    </aside>
  );
}

function ProductDock({ item }: { item: VideoFeedItem }) {
  const product = asProduct(item);
  const discount = discountPercent(item);
  const { openProduct } = useBz();

  return (
    <div className="watch__dock">
      <AppLink
        href={pathFromScreen("pdp", item.id)}
        onNavigate={() => openProduct(product)}
        className="watch__dock-product"
        ariaLabel={`View ${item.name}`}
      >
        <span className="watch__dock-info">
          <span className="watch__dock-name">{item.name}</span>
          <span className="watch__dock-price">
            {formatNPR(item.price)}
            {item.original && item.original > item.price ? (
              <span className="watch__dock-discount">-{discount}%</span>
            ) : null}
          </span>
        </span>
        <span className="watch__dock-view">
          View product
          <Icon name="arrowRight" size={16} />
        </span>
      </AppLink>
      <div className="watch__dock-actions">
        <PdpMakeOfferButton product={product} size="md" />
        <PdpAddToCartButton product={product} size="md" label="Add to cart" />
      </div>
    </div>
  );
}

function WatchSlide({
  item,
  index,
  total,
  active,
  load,
  muted,
  playing,
  onTogglePlay,
  onToggleMute,
  onShare,
  onRecordView,
  registerVideo,
  registerSlide,
}: {
  item: VideoFeedItem;
  index: number;
  total: number;
  active: boolean;
  load: boolean;
  muted: boolean;
  playing: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onShare: (item: VideoFeedItem) => void;
  onRecordView: (
    item: VideoFeedItem,
    playbackPercent: number,
    duration: number,
    currentTime: number,
  ) => void;
  registerVideo: (index: number, el: HTMLVideoElement | null) => void;
  registerSlide: (index: number, el: HTMLDivElement | null) => void;
}) {
  const [progress, setProgress] = useState(0);
  const { savedProducts, toggleSaved } = useBz();
  const saved = savedProducts.includes(item.id);

  return (
    <div
      className="watch__slide"
      data-active={active}
      data-index={index}
      ref={(el) => registerSlide(index, el)}
    >
      <div className="watch__player" onClick={onTogglePlay}>
        <video
          ref={(el) => registerVideo(index, el)}
          className="watch__video"
          src={load ? (item.videoUrl ?? undefined) : undefined}
          poster={item.videoThumb ?? undefined}
          loop
          playsInline
          preload="metadata"
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            const next = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
            setProgress(next);
            onRecordView(item, next, video.duration, video.currentTime);
          }}
        />

        <div className="watch__player-top">
          <IconButton
            name={muted ? "mute" : "volume"}
            label={muted ? "Unmute" : "Mute"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMute();
            }}
            className="watch__iconbtn"
            size={36}
          />
        </div>

        {active && !playing ? (
          <span className="watch__play-overlay" aria-hidden="true">
            <Icon name="play" size={30} fill="currentColor" />
          </span>
        ) : null}

        <div className="watch__rail">
          <span className="watch__rail-action">
            <IconButton
              name="heart"
              label={saved ? `Remove ${item.name} from saved products` : `Save ${item.name}`}
              active={saved}
              onClick={(event) => {
                event.stopPropagation();
                void toggleSaved(item.id, item.name);
              }}
              className="watch__iconbtn"
              size={36}
            />
            <span>{saved ? "Saved" : "Save"}</span>
          </span>
          <span className="watch__rail-action">
            <IconButton
              name="share"
              label="Share product"
              onClick={(event) => {
                event.stopPropagation();
                onShare(item);
              }}
              className="watch__iconbtn"
              size={36}
            />
            <span>Share</span>
          </span>
        </div>

        <div className="watch__player-foot">
          <div className="watch__seller">
            <SellerAvatar item={item} />
            <AppLink
              href={item.seller.url}
              className="watch__seller-name"
              ariaLabel={`Visit ${item.seller.name} storefront`}
            >
              {item.seller.name}
            </AppLink>
            <span className="watch__views">
              <Icon name="eye" size={13} />
              {formatViews(item.engagement.views)}
            </span>
          </div>
          <div className="watch__caption">{item.caption || item.name}</div>
          <div className="watch__scrub">
            <div className="watch__scrub-track">
              <div className="watch__scrub-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="watch__scrub-count">
              {index + 1} / {total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoTheater() {
  const { nav } = useBz();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeVideoProductId = useBazaarStore((s) => s.activeVideoProductId);
  const queryClient = useQueryClient();
  const { data: feed, isLoading, isError, error } = useVideoFeed();
  const items = useMemo(
    () =>
      (feed?.items ?? []).filter(
        (item) => typeof item.videoUrl === "string" && item.videoUrl.trim().length > 0,
      ),
    [feed],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewedIds = useRef(new Set<string>());
  // URL wins once it commits; fall back to the id seeded by openVideo so an
  // optimistic open lands on the clicked reel rather than the feed's first item.
  const startProductId =
    searchParams.get("product")?.trim() || activeVideoProductId?.trim() || undefined;

  const clamped = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const active = items[clamped];

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else nav("home");
  }, [nav, router]);

  const scrollToSlide = useCallback((index: number, smooth = true) => {
    const stage = stageRef.current;
    const slide = slideRefs.current[index];
    if (!stage || !slide) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top =
      stage.scrollTop + slide.getBoundingClientRect().top - stage.getBoundingClientRect().top;
    stage.scrollTo({
      top,
      behavior: smooth && !reduceMotion ? "smooth" : "auto",
    });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (items.length === 0) return;
      const target = Math.max(0, Math.min(items.length - 1, next));
      setActiveIndex(target);
      setPlaying(true);
      scrollToSlide(target);
    },
    [items.length, scrollToSlide],
  );

  // Deep link: ?product=<id> opens that reel.
  useEffect(() => {
    if (!startProductId || items.length === 0) return;
    const index = items.findIndex((item) => item.id === startProductId);
    if (index < 0) return;
    setActiveIndex(index);
    scrollToSlide(index, false);
  }, [items, scrollToSlide, startProductId]);

  // Only the in-view reel plays; the rest pause and rewind.
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = muted;
      if (index === clamped) {
        if (playing) void video.play().catch(() => setPlaying(false));
        else video.pause();
      } else {
        video.pause();
        if (video.currentTime > 0) video.currentTime = 0;
      }
    });
  }, [clamped, muted, playing, items.length]);

  // Mobile vertical scroll drives the active reel.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isNaN(index)) continue;
          setActiveIndex(index);
          setPlaying(true);
        }
      },
      { root: stage, threshold: [0.6] },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target && /input|textarea|select/i.test((event.target as HTMLElement).tagName))
        return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        goTo(clamped + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        goTo(clamped - 1);
      } else if (event.key.toLowerCase() === "m") {
        setMuted((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clamped, goTo]);

  const recordView = useCallback(
    (item: VideoFeedItem, playbackPercent: number, duration: number, currentTime: number) => {
      if (!item.videoId || playbackPercent < 20 || viewedIds.current.has(item.videoId)) return;
      viewedIds.current.add(item.videoId);
      void videosApi
        .recordView(item.videoId, {
          eventType: "qualified_view",
          source: "watch_feed",
          playbackPercent,
          watchMs: Math.round(currentTime * 1000),
          videoDurationMs: Math.round(duration * 1000),
        })
        .then((result) => {
          if (!result.counted || result.viewCount == null) return;
          queryClient.setQueryData<VideoFeedResponse>(
            queryKeys.videos.feed("foryou"),
            (previous) =>
              previous
                ? {
                    ...previous,
                    items: previous.items.map((item) =>
                      item.videoId === result.videoId
                        ? {
                            ...item,
                            engagement: { ...item.engagement, views: result.viewCount as number },
                          }
                        : item,
                    ),
                  }
                : previous,
          );
        })
        .catch(() => {});
    },
    [queryClient],
  );

  const share = useCallback(async (item: VideoFeedItem) => {
    const url = productShareUrl(item.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.info("Link copied");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      toast.error("Could not share this product");
    }
  }, []);

  if (isLoading) {
    return (
      <section className="watch watch__loading" aria-label="Loading Watch feed">
        <Icon name="video" size={36} />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="watch watch__empty">
        <EmptyState
          dark
          title="Could not load videos"
          message={error instanceof Error ? error.message : "Try again in a moment."}
          cta="Browse products"
          ctaHref={searchPath()}
        />
      </section>
    );
  }

  if (!active) {
    return (
      <section className="watch">
        <header className="watch__head">
          <div className="container">
            <IconButton
              name="chevronLeft"
              label="Back"
              onClick={goBack}
              className="watch__iconbtn"
            />
          </div>
        </header>
        <div className="watch__empty">
          <EmptyState
            dark
            title="No videos yet"
            message="When sellers add product videos, they appear here."
            cta="Browse products"
            ctaHref={searchPath()}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="watch">
      <header className="watch__head">
        <div className="container">
          <IconButton name="chevronLeft" label="Back" onClick={goBack} className="watch__iconbtn" />
          <div className="watch__title">
            <span className="watch__eyebrow">
              <span className="watch__eyebrow-chip">
                <Icon name="play" size={12} fill="currentColor" />
              </span>
              Watch
            </span>
            <span className="watch__heading">
              Watch, <strong>bargain</strong>, buy
            </span>
          </div>
          <div className="watch__hints" aria-label="Keyboard shortcuts">
            <span className="watch__hint">
              <kbd className="watch__kbd">↑</kbd>
              <kbd className="watch__kbd">↓</kbd>
              scroll
            </span>
            <span className="watch__hint">
              <kbd className="watch__kbd">M</kbd>
              mute
            </span>
          </div>
        </div>
      </header>

      <div className="container watch__layout">
        <div className="watch__queue-wrap">
          <p className="watch__queue-label">Up next</p>
          <div className="watch__queue">
            {items.map((item, index) => (
              <WatchQueueItem
                key={item.id}
                item={item}
                active={index === clamped}
                onSelect={() => goTo(index)}
              />
            ))}
          </div>
        </div>

        <div className="watch__stage">
          <div
            className="watch__stage-scroller"
            ref={stageRef}
            aria-label="Video feed"
            tabIndex={0}
          >
            {items.map((item, index) => (
              <WatchSlide
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                active={index === clamped}
                load={Math.abs(index - clamped) <= 1}
                muted={muted}
                playing={playing}
                onTogglePlay={() => setPlaying((value) => !value)}
                onToggleMute={() => setMuted((value) => !value)}
                onShare={(target) => void share(target)}
                onRecordView={recordView}
                registerVideo={(i, el) => {
                  videoRefs.current[i] = el;
                }}
                registerSlide={(i, el) => {
                  slideRefs.current[i] = el;
                }}
              />
            ))}
          </div>

          <div className="watch__stage-nav">
            <IconButton
              name="chevronUp"
              label="Previous video"
              onClick={() => goTo(clamped - 1)}
              disabled={clamped === 0}
              className="watch__iconbtn"
            />
            <IconButton
              name="chevronDown"
              label="Next video"
              onClick={() => goTo(clamped + 1)}
              disabled={clamped === items.length - 1}
              className="watch__iconbtn"
            />
          </div>
        </div>

        <ShopPanel item={active} />
      </div>

      <ProductDock item={active} />
    </section>
  );
}
