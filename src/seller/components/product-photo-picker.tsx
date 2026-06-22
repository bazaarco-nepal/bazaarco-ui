"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { ImageCropModal } from "@/components/common/image-crop-modal";
import { IMAGE_PRESETS } from "@/shared/lib/imagePresets";

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
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

type CropDraft = {
  objectUrl: string;
  sourceName: string;
  replaceIndex: number | null;
};

function normalizeFileName(name: string) {
  return name.trim().toLowerCase();
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

  const onCropComplete = (file: File) => {
    if (!cropDraft) return;
    revoke(cropDraft.objectUrl);
    const previewUrl = URL.createObjectURL(file);
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
          image={cropDraft.objectUrl}
          aspect={IMAGE_PRESETS.product.aspect}
          cropShape={IMAGE_PRESETS.product.cropShape}
          maxEdge={IMAGE_PRESETS.product.maxEdge}
          subtitle={
            batchTotal > 1
              ? `Photo ${batchTotal - cropQueue.length} of ${batchTotal} · drag to position`
              : undefined
          }
          onComplete={onCropComplete}
          onCancel={closeCrop}
        />
      )}
    </>
  );
}
