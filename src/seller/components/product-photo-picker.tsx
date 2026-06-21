"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

export type ProductPhoto = {
  id: string;
  previewUrl: string;
  sourceName: string;
  // A freshly captured photo carries a `file` to upload. A photo already hosted
  // on the CDN (editing an existing listing) carries `remoteUrl` instead and is
  // reused as-is on save, never re-uploaded.
  file?: File;
  remoteUrl?: string;
};

const MAX_PHOTOS = 5;
const CROP_VIEW = 300;
const OUTPUT_SIZE = 1200;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

type CropDraft = {
  objectUrl: string;
  sourceName: string;
  replaceIndex: number | null;
};

function normalizeFileName(name: string) {
  return name.trim().toLowerCase();
}

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
  stepCurrent,
  stepTotal,
}: {
  objectUrl: string;
  onConfirm: (file: File, previewUrl: string) => void;
  onCancel: () => void;
  // When a seller picks several photos at once we crop them one after another;
  // these drive the "Photo 2 of 4" progress hint. Absent for a single photo.
  stepCurrent?: number;
  stepTotal?: number;
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
  const isBatch = !!stepTotal && stepTotal > 1;
  const moreToCome = isBatch && (stepCurrent ?? 0) < (stepTotal ?? 0);

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
        <p style={{ margin: "0 0 16px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
          {isBatch
            ? `Photo ${stepCurrent} of ${stepTotal} · drag to position`
            : "Drag to position · zoom and brightness below"}
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
            className="bz-hover-dim"
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
            {isBatch ? "Skip" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => void handleUse()}
            disabled={!loaded || busy}
            className="bz-hover-dim"
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
            {busy ? "Saving…" : moreToCome ? "Use & next" : "Use photo"}
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
  // Photos chosen in the same multi-select, waiting their turn in the cropper.
  const [cropQueue, setCropQueue] = useState<CropDraft[]>([]);
  const cropQueueRef = useRef(cropQueue);
  cropQueueRef.current = cropQueue;
  const cropDraftRef = useRef(cropDraft);
  cropDraftRef.current = cropDraft;
  // Size of the current multi-select batch, for the "Photo X of Y" hint. 0 = single.
  const [batchTotal, setBatchTotal] = useState(0);
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const revoke = (url: string) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const openFilePicker = (replaceIndex: number | null) => {
    if (replaceIndex === null && photos.length >= max) return;
    setError("");
    setPickIndex(replaceIndex);
    // Multi-select only makes sense when adding; replacing fills one slot.
    if (fileRef.current) fileRef.current.multiple = replaceIndex === null;
    fileRef.current?.click();
  };

  const isDuplicateName = (name: string, ignoreIndex: number | null) =>
    photos.some((photo, index) => {
      if (ignoreIndex !== null && index === ignoreIndex) return false;
      return normalizeFileName(photo.sourceName || photo.file?.name || "") === name;
    });

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the picked files BEFORE clearing the input: `e.target.files` is a
    // live FileList that resetting `value` empties, which would drop everything.
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    const replaceIndex = pickIndex;
    setPickIndex(null);
    if (files.length === 0) return;

    // Replace flow stays single-file: swap the chosen slot, ignore any extras.
    if (replaceIndex !== null) {
      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;
      if (isDuplicateName(normalizeFileName(file.name), replaceIndex)) {
        setError("You are not allowed to use the same photo twice.");
        return;
      }
      setBatchTotal(0);
      setCropQueue([]);
      setCropDraft({ objectUrl: URL.createObjectURL(file), sourceName: file.name, replaceIndex });
      return;
    }

    // Add flow accepts a whole gallery selection. Keep it within the remaining
    // slots and drop anything that duplicates an existing or already-picked name.
    const remaining = max - photos.length;
    if (remaining <= 0) return;

    const seen = new Set<string>();
    const batch: CropDraft[] = [];
    let droppedExtra = false;
    let droppedDuplicate = false;

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const name = normalizeFileName(file.name);
      if (isDuplicateName(name, null) || seen.has(name)) {
        droppedDuplicate = true;
        continue;
      }
      if (batch.length >= remaining) {
        droppedExtra = true;
        continue;
      }
      seen.add(name);
      batch.push({
        objectUrl: URL.createObjectURL(file),
        sourceName: file.name,
        replaceIndex: null,
      });
    }

    if (batch.length === 0) {
      if (droppedDuplicate) setError("You are not allowed to use the same photo twice.");
      return;
    }
    if (droppedExtra) setError(`You can add up to ${max} photos — extra photos weren't added.`);
    else if (droppedDuplicate) setError("Duplicate photos were skipped.");

    const first = batch[0];
    if (!first) return;
    setBatchTotal(batch.length);
    setCropQueue(batch.slice(1));
    setCropDraft(first);
  };

  // Pull the next queued photo into the cropper, or close out when the batch ends.
  const advanceQueue = () => {
    const rest = cropQueueRef.current;
    if (rest.length === 0) {
      setCropDraft(null);
      setCropQueue([]);
      setBatchTotal(0);
      return;
    }
    const next = rest[0];
    if (!next) {
      setCropDraft(null);
      setCropQueue([]);
      setBatchTotal(0);
      return;
    }
    const remaining = rest.slice(1);
    cropQueueRef.current = remaining;
    setCropQueue(remaining);
    setCropDraft(next);
  };

  const closeCrop = () => {
    if (cropDraftRef.current) revoke(cropDraftRef.current.objectUrl);
    advanceQueue();
  };

  // Only object URLs we minted need revoking; a remote (CDN) preview must be
  // left intact so the image survives a remove/replace elsewhere in the gallery.
  const revokeLocalPreview = (photo: ProductPhoto | undefined) => {
    if (photo?.file) revoke(photo.previewUrl);
  };

  const onCropConfirm = (file: File, previewUrl: string) => {
    if (!cropDraft) return;
    revoke(cropDraft.objectUrl);
    const id = crypto.randomUUID?.() ?? String(Date.now());
    const next: ProductPhoto = { id, previewUrl, file, sourceName: cropDraft.sourceName };
    // Use the live ref, not the closed-over prop: across a batch each confirm
    // must append to the photos already added earlier in the same batch.
    const current = photosRef.current;
    if (cropDraft.replaceIndex !== null) {
      revokeLocalPreview(current[cropDraft.replaceIndex]);
      onChange(current.map((p, i) => (i === cropDraft.replaceIndex ? next : p)));
    } else {
      onChange([...current, next]);
    }
    advanceQueue();
  };

  const removePhoto = (index: number) => {
    revokeLocalPreview(photos[index]);
    onChange(photos.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.file) revoke(p.previewUrl);
      });
      // Don't leak previews for photos still queued/being cropped at unmount.
      if (cropDraftRef.current) revoke(cropDraftRef.current.objectUrl);
      cropQueueRef.current.forEach((d) => revoke(d.objectUrl));
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

      <div className="bz-photo-grid">
        {photos.map((photo, i) => (
          <div key={photo.id} className="bz-photo-cell">
            <img
              src={photo.previewUrl}
              alt={`Product photo ${i + 1}`}
              className="bz-photo-cell__img"
            />

            <button
              type="button"
              onClick={() => openFilePicker(i)}
              aria-label={`Replace photo ${i + 1}`}
              title="Replace"
              className="bz-photo-cell__replace"
            >
              <span className="bz-photo-cell__replace-icon">
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
                // Sit above the full-cell replace overlay (z-index 1) so the tap
                // lands on remove, not the replace picker underneath it.
                zIndex: 2,
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
                transition: "background var(--dur-micro, 120ms) ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(11,18,32,.8)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(11,18,32,.55)";
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
              border: "1.5px dashed var(--ink-300)",
              background: "var(--line-100)",
              color: "var(--ink-500)",
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
            <Icon name="image" size={22} color="var(--ink-500)" />
            {photos.length === 0 ? "Add photo" : "Add more"}
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: "10px 0 0",
            color: "var(--red)",
            fontSize: ".8125rem",
            fontWeight: 700,
          }}
        >
          {error}
        </p>
      )}

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
          stepCurrent={batchTotal - cropQueue.length}
          stepTotal={batchTotal}
        />
      )}
    </>
  );
}
