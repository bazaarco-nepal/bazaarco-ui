"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { Icon } from "@/components/ui";

interface ImageLightboxProps {
  images: string[];
  index: number;
  alt: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}

// One control style for the whole viewer — close and the prev/next arrows are
// the same size, colour, and layer so the chrome reads as a single set.
const chromeBtn: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,.14)",
  color: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  WebkitBackdropFilter: "blur(6px)",
  backdropFilter: "blur(6px)",
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type FitMetrics = {
  containerW: number;
  containerH: number;
  displayW: number;
  displayH: number;
};

function pinchDistance(touches: React.TouchList) {
  const a = touches[0];
  const b = touches[1];
  if (!a || !b) return 0;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

function computeFit(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
): FitMetrics {
  if (!naturalW || !naturalH || !containerW || !containerH) {
    return { containerW, containerH, displayW: 0, displayH: 0 };
  }
  const fit = Math.min(containerW / naturalW, containerH / naturalH);
  return {
    containerW,
    containerH,
    displayW: naturalW * fit,
    displayH: naturalH * fit,
  };
}

function maxPan(metrics: FitMetrics, scale: number) {
  const scaledW = metrics.displayW * scale;
  const scaledH = metrics.displayH * scale;
  return {
    x: Math.max(0, (scaledW - metrics.containerW) / 2),
    y: Math.max(0, (scaledH - metrics.containerH) / 2),
  };
}

function clampOffset(
  x: number,
  y: number,
  scale: number,
  metrics: FitMetrics | null,
): { x: number; y: number } {
  if (!metrics || scale <= MIN_SCALE) return { x: 0, y: 0 };
  const { x: maxX, y: maxY } = maxPan(metrics, scale);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

function ZoomableImage({
  src,
  alt,
  scale,
  onScaleChange,
  onSwipe,
}: {
  src: string;
  alt: string;
  scale: number;
  onScaleChange: (next: number | ((s: number) => number)) => void;
  /** Horizontal swipe to the previous (-1) / next (+1) image when not zoomed. */
  onSwipe?: (dir: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const metricsRef = useRef<FitMetrics | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const img = imgRef.current;
    if (!vp || !img?.naturalWidth) return;
    metricsRef.current = computeFit(
      img.naturalWidth,
      img.naturalHeight,
      vp.clientWidth,
      vp.clientHeight,
    );
    setOffset((prev) => clampOffset(prev.x, prev.y, scale, metricsRef.current));
  }, [scale]);

  useLayoutEffect(() => {
    measure();
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(vp);
    return () => ro.disconnect();
  }, [measure, src]);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (scale <= MIN_SCALE) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    setOffset((prev) => clampOffset(prev.x, prev.y, scale, metricsRef.current));
  }, [scale]);

  const applyOffset = useCallback((x: number, y: number, currentScale: number) => {
    setOffset(clampOffset(x, y, currentScale, metricsRef.current));
  }, []);

  const setClampedScale = useCallback(
    (next: number | ((s: number) => number)) => {
      onScaleChange((s) => {
        const v = typeof next === "function" ? next(s) : next;
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));
        setOffset((prev) => clampOffset(prev.x, prev.y, clamped, metricsRef.current));
        return clamped;
      });
    },
    [onScaleChange],
  );

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setClampedScale((s) => s + (e.deltaY < 0 ? 0.2 : -0.2));
  };

  const onDoubleClick = () => {
    if (scale > 1.05) {
      onScaleChange(MIN_SCALE);
      setOffset({ x: 0, y: 0 });
    } else {
      onScaleChange(2.5);
      setOffset({ x: 0, y: 0 });
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (scale <= 1 || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    panRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    e.preventDefault();
    const nx = panRef.current.ox + (e.clientX - panRef.current.x);
    const ny = panRef.current.oy + (e.clientY - panRef.current.y);
    applyOffset(nx, ny, scale);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (panRef.current) {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    panRef.current = null;
    setIsPanning(false);
    setOffset((prev) => clampOffset(prev.x, prev.y, scale, metricsRef.current));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: pinchDistance(e.touches), scale };
      swipeRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (!t) return;
      if (scale > 1) {
        panRef.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
        setIsPanning(true);
      } else if (onSwipe) {
        // Not zoomed: track the touch so touchend can detect a horizontal swipe.
        swipeRef.current = { x: t.clientX, y: t.clientY };
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = pinchDistance(e.touches);
      setClampedScale(pinchRef.current.scale * (dist / pinchRef.current.dist));
      return;
    }
    if (e.touches.length === 1 && panRef.current && scale > 1) {
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      const nx = panRef.current.ox + (t.clientX - panRef.current.x);
      const ny = panRef.current.oy + (t.clientY - panRef.current.y);
      applyOffset(nx, ny, scale);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (swipeRef.current && scale <= MIN_SCALE) {
      const t = e.changedTouches[0];
      if (t) {
        const dx = t.clientX - swipeRef.current.x;
        const dy = t.clientY - swipeRef.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          onSwipe?.(dx < 0 ? 1 : -1);
        }
      }
      swipeRef.current = null;
    }
    if (e.touches.length === 0) {
      panRef.current = null;
      setIsPanning(false);
      setOffset((prev) => clampOffset(prev.x, prev.y, scale, metricsRef.current));
    }
  };

  const canPan = scale > 1 && loaded;

  return (
    <div
      ref={viewportRef}
      role="presentation"
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        touchAction: canPan ? "none" : "manipulation",
        cursor: canPan ? (isPanning ? "grabbing" : "grab") : "zoom-in",
        position: "relative",
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => {
          setLoaded(true);
          measure();
        }}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          borderRadius: "var(--r-md)",
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transformOrigin: "center center",
          transition: isPanning || pinchRef.current ? "none" : "transform 0.12s ease-out",
          userSelect: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}

/** Full-screen product image viewer with pinch, scroll-wheel, and button zoom. */
export function ImageLightbox({ images, index, alt, onIndex, onClose }: ImageLightboxProps) {
  const count = images.length;
  const safeIndex = Math.min(index, count - 1);
  const src = images[safeIndex];
  const [scale, setScale] = useState(1);

  const go = (dir: number) => onIndex((safeIndex + dir + count) % count);

  useEffect(() => {
    setScale(1);
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) go(-1);
      else if (e.key === "ArrowRight" && count > 1) go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, count]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Nothing to show without a source image (e.g. an empty gallery).
  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(15,17,21,.97)",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onClose}
    >
      {/* Top bar — counter centered, close top-right. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0,
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ width: 42, flexShrink: 0 }} aria-hidden="true" />
        <span
          style={{
            color: "rgba(255,255,255,.85)",
            fontSize: ".875rem",
            fontWeight: 600,
            letterSpacing: ".02em",
          }}
        >
          {count > 1 ? `${safeIndex + 1} / ${count}` : ""}
        </span>
        <button type="button" aria-label="Close" onClick={onClose} style={chromeBtn}>
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* One large image, centered; prev/next arrows on the same layer.
          alignItems must stretch so the zoom viewport fills this area — its
          image uses maxHeight:100%, which only resolves against a filled box;
          centering instead lets a tall image overflow up over the close button. */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          minHeight: 0,
          overflow: "hidden",
          padding: "0 12px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ZoomableImage
          key={src}
          src={src}
          alt={alt}
          scale={scale}
          onScaleChange={setScale}
          onSwipe={count > 1 ? go : undefined}
        />
        {count > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            style={{
              ...chromeBtn,
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <Icon name="chevronLeft" size={22} />
          </button>
        )}
        {count > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            style={{
              ...chromeBtn,
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <Icon name="chevronRight" size={22} />
          </button>
        )}
      </div>

      {/* Thumbnail strip — centered, pinned safely above the home indicator. */}
      {count > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "nowrap",
            overflowX: "auto",
            flexShrink: 0,
            padding: "14px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
            scrollbarWidth: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((thumb, i) => (
            <button
              key={thumb + i}
              type="button"
              aria-label={`View photo ${i + 1}`}
              aria-pressed={i === safeIndex}
              onClick={() => onIndex(i)}
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
                border: `2px solid ${i === safeIndex ? "#fff" : "transparent"}`,
                cursor: "pointer",
                padding: 0,
                background: "none",
                opacity: i === safeIndex ? 1 : 0.55,
                transition: "opacity .15s ease",
              }}
            >
              <img
                src={thumb}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
