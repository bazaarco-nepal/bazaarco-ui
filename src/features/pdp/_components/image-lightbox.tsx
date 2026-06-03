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

const navBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,.92)",
  color: "var(--ink-900)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type FitMetrics = {
  containerW: number;
  containerH: number;
  displayW: number;
  displayH: number;
};

function pinchDistance(touches: TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
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
}: {
  src: string;
  alt: string;
  scale: number;
  onScaleChange: (next: number | ((s: number) => number)) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const metricsRef = useRef<FitMetrics | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
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
    } else if (e.touches.length === 1 && scale > 1) {
      panRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offset.x,
        oy: offset.y,
      };
      setIsPanning(true);
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
      e.preventDefault();
      const nx = panRef.current.ox + (e.touches[0].clientX - panRef.current.x);
      const ny = panRef.current.oy + (e.touches[0].clientY - panRef.current.y);
      applyOffset(nx, ny, scale);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
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

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + 0.5));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - 0.5));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(8,12,22,.92)",
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={scale <= MIN_SCALE}
            onClick={zoomOut}
            style={{
              ...navBtn,
              background: "rgba(255,255,255,.16)",
              color: "#fff",
              opacity: scale <= MIN_SCALE ? 0.4 : 1,
            }}
          >
            <Icon name="minus" size={20} />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={scale >= MAX_SCALE}
            onClick={zoomIn}
            style={{
              ...navBtn,
              background: "rgba(255,255,255,.16)",
              color: "#fff",
              opacity: scale >= MAX_SCALE ? 0.4 : 1,
            }}
          >
            <Icon name="zoomIn" size={20} />
          </button>
          <span style={{ color: "rgba(255,255,255,.75)", fontSize: ".8125rem", fontWeight: 600 }}>
            Drag to explore · double-click to reset
          </span>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{ ...navBtn, background: "rgba(255,255,255,.16)", color: "#fff" }}
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 14,
          minHeight: 0,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {count > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            style={{ ...navBtn, alignSelf: "center" }}
          >
            <Icon name="chevronLeft" size={22} />
          </button>
        )}
        <ZoomableImage key={src} src={src} alt={alt} scale={scale} onScaleChange={setScale} />
        {count > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            style={{ ...navBtn, alignSelf: "center" }}
          >
            <Icon name="chevronRight" size={22} />
          </button>
        )}
      </div>

      {count > 1 && (
        <div
          style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}
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
                width: 52,
                height: 64,
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
                border: `2px solid ${i === safeIndex ? "#fff" : "transparent"}`,
                cursor: "pointer",
                padding: 0,
                background: "none",
                opacity: i === safeIndex ? 1 : 0.6,
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

/** Floating zoom control on the PDP gallery (photos only). */
export function PdpZoomButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Zoom photo"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        zIndex: 3,
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,.92)",
        boxShadow: "var(--sh-2)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-700)",
      }}
    >
      <Icon name="zoomIn" size={18} />
    </button>
  );
}
