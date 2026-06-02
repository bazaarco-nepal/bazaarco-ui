"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

export type ProductPhoto = {
  id: string;
  previewUrl: string;
  file: File;
};

const MAX_PHOTOS = 5;
const CROP_VIEW = 300;
const OUTPUT_SIZE = 1200;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

type CropDraft = {
  objectUrl: string;
  replaceIndex: number | null;
};

function clampOffset(
  offset: { x: number; y: number },
  dw: number,
  dh: number,
): { x: number; y: number } {
  const minX = CROP_VIEW - dw;
  const minY = CROP_VIEW - dh;
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
}

async function renderCroppedImage(
  img: HTMLImageElement,
  zoom: number,
  offset: { x: number; y: number },
  brightness: number,
): Promise<Blob> {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const baseScale = Math.max(CROP_VIEW / nw, CROP_VIEW / nh);
  const scale = baseScale * zoom;
  const dw = nw * scale;
  const dh = nh * scale;
  const ix = (CROP_VIEW - dw) / 2 + offset.x;
  const iy = (CROP_VIEW - dh) / 2 + offset.y;
  const sx = (0 - ix) / scale;
  const sy = (0 - iy) / scale;
  const sw = CROP_VIEW / scale;
  const sh = CROP_VIEW / scale;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.filter = `brightness(${brightness}%)`;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      0.9,
    );
  });
}

function ImageCropModal({
  objectUrl,
  onConfirm,
  onCancel,
}: {
  objectUrl: string;
  onConfirm: (file: File, previewUrl: string) => void;
  onCancel: () => void;
}) {
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
    const baseScale = Math.max(CROP_VIEW / nw, CROP_VIEW / nh);
    const scale = baseScale * zoom;
    const dw = nw * scale;
    const dh = nh * scale;
    return { dw, dh, scale };
  }, [zoom]);

  const resetPosition = useCallback(() => {
    const L = layout();
    if (!L) return;
    setOffset(clampOffset({ x: 0, y: 0 }, L.dw, L.dh));
  }, [layout]);

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
    setOffset(clampOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }, L.dw, L.dh));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleUse = async () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    setBusy(true);
    try {
      const blob = await renderCroppedImage(img, zoom, offset, brightness);
      const file = new File([blob], `product-${Date.now()}.jpg`, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(file);
      onConfirm(file, previewUrl);
    } catch {
      /* keep modal open */
    } finally {
      setBusy(false);
    }
  };

  const L = layout();
  const ix = L ? (CROP_VIEW - L.dw) / 2 + offset.x : 0;
  const iy = L ? (CROP_VIEW - L.dh) / 2 + offset.y : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop and adjust photo"
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
          Crop & adjust
        </h3>
        <p
          className="ne"
          style={{ margin: "0 0 16px", fontSize: ".8125rem", color: "var(--ink-500)" }}
        >
          Drag to position · zoom and brightness below
        </p>

        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "relative",
            width: CROP_VIEW,
            height: CROP_VIEW,
            margin: "0 auto",
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            background: "#111",
            cursor: loaded ? "grab" : "default",
            touchAction: "none",
          }}
        >
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
          Zoom
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

        <label
          style={{
            display: "block",
            marginTop: 12,
            fontSize: ".75rem",
            fontWeight: 700,
            color: "var(--ink-600)",
          }}
        >
          Brightness
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

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--line-200)",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
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
            {busy ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductPhotoPicker({
  photos,
  onChange,
  max = MAX_PHOTOS,
  min = 1,
}: {
  photos: ProductPhoto[];
  onChange: (photos: ProductPhoto[]) => void;
  max?: number;
  min?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const revoke = (url: string) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const openFilePicker = (replaceIndex: number | null) => {
    if (replaceIndex === null && photos.length >= max) return;
    setPickIndex(replaceIndex);
    fileRef.current?.click();
  };

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    setCropDraft({ objectUrl, replaceIndex: pickIndex });
    setPickIndex(null);
  };

  const closeCrop = () => {
    if (cropDraft) revoke(cropDraft.objectUrl);
    setCropDraft(null);
  };

  const onCropConfirm = (file: File, previewUrl: string) => {
    if (!cropDraft) return;
    revoke(cropDraft.objectUrl);
    const id = crypto.randomUUID?.() ?? String(Date.now());
    const next: ProductPhoto = { id, previewUrl, file };
    if (cropDraft.replaceIndex !== null) {
      const prev = photos[cropDraft.replaceIndex];
      if (prev) revoke(prev.previewUrl);
      onChange(photos.map((p, i) => (i === cropDraft.replaceIndex ? next : p)));
    } else {
      onChange([...photos, next]);
    }
    setCropDraft(null);
  };

  const removePhoto = (index: number) => {
    const removed = photos[index];
    if (removed) revoke(removed.previewUrl);
    onChange(photos.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => revoke(p.previewUrl));
    };
  }, []);

  const canAddMore = photos.length < max;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={onFileChosen}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: "var(--r-md)",
              overflow: "hidden",
              border: "1.5px solid var(--line-200)",
            }}
          >
            <img
              src={photo.previewUrl}
              alt={`Product photo ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />

            {/* Tap / hover the photo to replace it. The dim + change icon only
                show on hover so the grid stays clean. */}
            <button
              type="button"
              onClick={() => openFilePicker(i)}
              aria-label={`Replace photo ${i + 1}`}
              title="Replace"
              style={{
                position: "absolute",
                inset: 0,
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: hover === i ? "rgba(11,18,32,.32)" : "transparent",
                opacity: hover === i ? 1 : 0,
                transition: "opacity var(--dur-standard) var(--ease)",
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="refresh" size={18} color="var(--ink-700)" />
              </span>
            </button>

            {/* Remove — plain X, top-right, always available. */}
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label={`Remove photo ${i + 1}`}
              title="Remove"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: "rgba(11,18,32,.55)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="x" size={14} color="#fff" />
            </button>

            <span
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--blue-deep)",
                color: "#fff",
                fontSize: ".7rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </span>
          </div>
        ))}
        {canAddMore && (
          <button
            type="button"
            onClick={() => openFilePicker(null)}
            style={{
              aspectRatio: "1",
              borderRadius: "var(--r-md)",
              border: "1.5px dashed var(--saffron)",
              background: "rgba(247,127,0,.06)",
              color: "var(--saffron)",
              fontWeight: 800,
              fontSize: ".75rem",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 8,
            }}
          >
            <Icon name="image" size={22} color="var(--saffron)" />
            {photos.length === 0 ? "Add photo" : "Add more"}
          </button>
        )}
      </div>

      {photos.length > 0 &&
        (photos.length < min ? (
          <p
            style={{
              fontSize: ".8125rem",
              color: "var(--saffron)",
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            Add {min - photos.length} more — {min} photos required
          </p>
        ) : (
          <p
            style={{
              fontSize: ".8125rem",
              color: "var(--success)",
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            <Icon
              name="check"
              size={14}
              color="var(--success)"
              style={{ verticalAlign: "middle" }}
            />{" "}
            {photos.length}/{max} photos ready
          </p>
        ))}

      {cropDraft && (
        <ImageCropModal
          objectUrl={cropDraft.objectUrl}
          onConfirm={onCropConfirm}
          onCancel={closeCrop}
        />
      )}
    </>
  );
}
