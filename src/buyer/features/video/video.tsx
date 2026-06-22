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
import { productShareUrl, searchPath } from "@/config/routes";
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
  return (
    <div className="watch__dock">
      <div className="watch__dock-row">
        <span className="watch__dock-thumb">
          <ProductImage item={item} />
        </span>
        <span className="watch__dock-copy">
          <span className="watch__dock-name">{item.name}</span>
          <span className="watch__dock-price">{formatNPR(item.price)}</span>
        </span>
      </div>
      <div className="watch__dock-actions">
        <span>
          <PdpMakeOfferButton product={product} size="md" />
        </span>
        <span>
          <PdpAddToCartButton product={product} size="md" label="Add" />
        </span>
      </div>
    </div>
  );
}

function ShopSheet({ item, onClose }: { item: VideoFeedItem; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const focusables = Array.from(
      card.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    focusables[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="watch__sheet" onClick={onClose}>
      <div
        ref={cardRef}
        className="watch__sheet-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Shop ${item.name}`}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          startY.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          const endY = event.changedTouches[0]?.clientY;
          if (startY.current != null && endY != null && endY - startY.current > 72) onClose();
          startY.current = null;
        }}
      >
        <div className="watch__sheet-grab" />
        <div className="watch__sheet-head">
          <div className="watch__media">
            <ProductImage item={item} />
          </div>
          <div className="watch__sheet-details">
            <ProductSummary item={item} />
          </div>
          <IconButton name="close" label="Close shop panel" onClick={onClose} size={36} />
        </div>
        <div className="watch__actions">
          <ShopActions item={item} />
        </div>
      </div>
    </div>
  );
}

export function VideoTheater() {
  const { nav } = useBz();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [progress, setProgress] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const viewedIds = useRef(new Set<string>());
  const startProductId = searchParams.get("product")?.trim();

  const active = items[Math.min(activeIndex, Math.max(items.length - 1, 0))];

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else nav("home");
  }, [nav, router]);

  const selectIndex = useCallback(
    (next: number) => {
      if (items.length === 0) return;
      setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
      setProgress(0);
      setPlaying(true);
      setSheetOpen(false);
    },
    [items.length],
  );

  useEffect(() => {
    if (!startProductId || items.length === 0) return;
    const index = items.findIndex((item) => item.id === startProductId);
    if (index >= 0) selectIndex(index);
  }, [items, selectIndex, startProductId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (playing) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [active?.id, muted, playing]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target && /input|textarea|select/i.test((event.target as HTMLElement).tagName))
        return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectIndex(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectIndex(activeIndex - 1);
      } else if (event.key.toLowerCase() === "m") {
        setMuted((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, selectIndex]);

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

  const share = useCallback(async () => {
    if (!active) return;
    const url = productShareUrl(active.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: active.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.info("Link copied");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") return;
      toast.error("Could not share this product");
    }
  }, [active]);

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
              swipe
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
                active={index === activeIndex}
                onSelect={() => selectIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="watch__stage">
          <div
            className="watch__player"
            onTouchStart={(event) => {
              touchStartY.current = event.touches[0]?.clientY ?? null;
            }}
            onTouchEnd={(event) => {
              const endY = event.changedTouches[0]?.clientY;
              if (touchStartY.current == null || endY == null) return;
              const delta = endY - touchStartY.current;
              if (Math.abs(delta) > 64) selectIndex(activeIndex + (delta < 0 ? 1 : -1));
              touchStartY.current = null;
            }}
          >
            <video
              key={active.id}
              ref={videoRef}
              className="watch__video"
              src={active.videoUrl ?? undefined}
              poster={active.videoThumb ?? undefined}
              muted={muted}
              autoPlay
              loop
              playsInline
              preload="metadata"
              onClick={() => setPlaying((value) => !value)}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                const nextProgress =
                  video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
                setProgress(nextProgress);
                recordView(active, nextProgress, video.duration, video.currentTime);
              }}
            />

            <div className="watch__player-top">
              <IconButton
                name={muted ? "mute" : "volume"}
                label={muted ? "Unmute" : "Mute"}
                onClick={(event) => {
                  event.stopPropagation();
                  setMuted((value) => !value);
                }}
                className="watch__iconbtn"
                size={36}
              />
            </div>

            <div className="watch__mobile">
              <button
                type="button"
                className="watch__product-pill"
                onClick={() => setSheetOpen(true)}
              >
                <span className="watch__pill-thumb">
                  <ProductImage item={active} />
                </span>
                <span className="watch__pill-copy">
                  <span className="watch__pill-name">{active.name}</span>
                  <span className="watch__pill-price">{formatNPR(active.price)}</span>
                </span>
                <Icon name="arrowRight" size={14} />
              </button>
              <IconButton
                name={muted ? "mute" : "volume"}
                label={muted ? "Unmute" : "Mute"}
                onClick={() => setMuted((value) => !value)}
                className="watch__iconbtn"
                size={36}
              />
            </div>

            <div className="watch__rail">
              <span className="watch__rail-action">
                <IconButton
                  name="share"
                  label="Share product"
                  onClick={() => void share()}
                  className="watch__iconbtn"
                  size={36}
                />
                <span>Share</span>
              </span>
            </div>

            <div className="watch__player-foot">
              <div className="watch__seller">
                <SellerAvatar item={active} />
                <AppLink
                  href={active.seller.url}
                  className="watch__seller-name"
                  ariaLabel={`Visit ${active.seller.name} storefront`}
                >
                  {active.seller.name}
                </AppLink>
                <span className="watch__views">
                  <Icon name="eye" size={13} />
                  {formatViews(active.engagement.views)}
                </span>
              </div>
              <div className="watch__caption">{active.caption || active.name}</div>
              <div className="watch__scrub">
                <div className="watch__scrub-track">
                  <div className="watch__scrub-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="watch__scrub-count">
                  {activeIndex + 1} / {items.length}
                </span>
              </div>
            </div>
          </div>

          <div className="watch__stage-nav">
            <IconButton
              name="chevronUp"
              label="Previous video"
              onClick={() => selectIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="watch__iconbtn"
            />
            <IconButton
              name="chevronDown"
              label="Next video"
              onClick={() => selectIndex(activeIndex + 1)}
              disabled={activeIndex === items.length - 1}
              className="watch__iconbtn"
            />
          </div>
        </div>

        <ShopPanel item={active} />
      </div>

      <ProductDock item={active} />
      {sheetOpen ? <ShopSheet item={active} onClose={() => setSheetOpen(false)} /> : null}
    </section>
  );
}
