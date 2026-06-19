"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type ImageCropModalProps = {
  objectUrl: string;
  /** Crop frame width / height (1 = square). */
  aspectRatio?: number;
  outputWidth: number;
  outputHeight: number;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  showBrightness?: boolean;
  /** Visual mask only — output is still rectangular. */
  maskShape?: "rect" | "circle";
  fileNamePrefix?: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

const VIEW_SIZE = 300;

function clampOffset(
  offset: { x: number; y: number },
  dw: number,
  dh: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  // The image is rendered at (viewW - dw) / 2 + offset.x (centred), so the
  // maximum safe shift in either direction is half the overflow — beyond that
  // the edge of the image would leave a visible gap (black area).
  const maxX = Math.max(0, (dw - viewW) / 2);
  const maxY = Math.max(0, (dh - viewH) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  };
}

async function renderCroppedImage(
  img: HTMLImageElement,
  zoom: number,
  offset: { x: number; y: number },
  brightness: number,
  viewW: number,
  viewH: number,
  outputW: number,
  outputH: number,
): Promise<Blob> {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const baseScale = Math.max(viewW / nw, viewH / nh);
  const scale = baseScale * zoom;
  const dw = nw * scale;
  const dh = nh * scale;
  const ix = (viewW - dw) / 2 + offset.x;
  const iy = (viewH - dh) / 2 + offset.y;
  const sx = (0 - ix) / scale;
  const sy = (0 - iy) / scale;
  const sw = viewW / scale;
  const sh = viewH / scale;

  const canvas = document.createElement("canvas");
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.filter = `brightness(${brightness}%)`;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputW, outputH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      0.9,
    );
  });
}

export function ImageCropModal({
  objectUrl,
  aspectRatio = 1,
  outputWidth,
  outputHeight,
  title,
  subtitle,
  confirmLabel,
  showBrightness = true,
  maskShape = "rect",
  fileNamePrefix = "image",
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("common.imageCrop.title");
  const resolvedSubtitle = subtitle ?? t("common.imageCrop.subtitle");
  const resolvedConfirmLabel = confirmLabel ?? t("common.imageCrop.confirm");
  const viewW = VIEW_SIZE;
  const viewH = Math.round(VIEW_SIZE / aspectRatio);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  const layout = useCallback(() => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return null;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const baseScale = Math.max(viewW / nw, viewH / nh);
    const scale = baseScale * zoom;
    return { dw: nw * scale, dh: nh * scale, scale };
  }, [viewH, viewW, zoom]);

  const resetPosition = useCallback(() => {
    const L = layout();
    if (!L) return;
    setOffset(clampOffset({ x: 0, y: 0 }, L.dw, L.dh, viewW, viewH));
  }, [layout, viewH, viewW]);

  useEffect(() => {
    if (loaded) resetPosition();
  }, [loaded, zoom, resetPosition]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const L = layout();
    if (!L) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(
      clampOffset(
        { x: dragRef.current.ox + dx, y: dragRef.current.oy + dy },
        L.dw,
        L.dh,
        viewW,
        viewH,
      ),
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleUse = async () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    setBusy(true);
    try {
      const blob = await renderCroppedImage(
        img,
        zoom,
        offset,
        brightness,
        viewW,
        viewH,
        outputWidth,
        outputHeight,
      );
      const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      onConfirm(file);
    } finally {
      setBusy(false);
    }
  };

  const L = layout();
  const ix = L ? (viewW - L.dw) / 2 + offset.x : 0;
  const iy = L ? (viewH - L.dh) / 2 + offset.y : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={resolvedTitle}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(11,18,32,.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: "var(--r-lg)",
          padding: 20,
          boxShadow: "var(--sh-3)",
        }}
      >
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          {resolvedTitle}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
          {resolvedSubtitle}
        </p>

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "relative",
            width: viewW,
            height: viewH,
            margin: "0 auto",
            borderRadius: maskShape === "circle" ? "50%" : "var(--r-md)",
            overflow: "hidden",
            background: "#111",
            cursor: loaded ? "grab" : "default",
            touchAction: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob preview for canvas crop */}
          <img
            ref={imgRef}
            src={objectUrl}
            alt=""
            onLoad={() => setLoaded(true)}
            draggable={false}
            style={{
              position: "absolute",
              left: ix,
              top: iy,
              width: L?.dw ?? "100%",
              height: L?.dh ?? "auto",
              maxWidth: "none",
              pointerEvents: "none",
              userSelect: "none",
              filter: `brightness(${brightness}%)`,
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,.85)",
              pointerEvents: "none",
              borderRadius: maskShape === "circle" ? "50%" : 0,
            }}
          />
        </div>

        <label
          style={{
            display: "block",
            marginTop: 16,
            fontSize: ".75rem",
            fontWeight: 700,
            color: "var(--ink-600)",
          }}
        >
          {t("common.imageCrop.zoom")}
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "var(--blue)" }}
        />

        {showBrightness ? (
          <>
            <label
              style={{
                display: "block",
                marginTop: 12,
                fontSize: ".75rem",
                fontWeight: 700,
                color: "var(--ink-600)",
              }}
            >
              {t("common.imageCrop.brightness")}
            </label>
            <input
              type="range"
              min={70}
              max={130}
              step={1}
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: "var(--saffron)" }}
            />
          </>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--red)",
              background: "#fff",
              color: "var(--red)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleUse()}
            disabled={!loaded || busy}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "var(--blue)",
              color: "#fff",
              fontWeight: 800,
              cursor: loaded && !busy ? "pointer" : "not-allowed",
              opacity: loaded && !busy ? 1 : 0.6,
            }}
          >
            {busy ? t("common.imageCrop.saving") : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
