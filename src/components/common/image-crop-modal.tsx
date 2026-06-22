"use client";

import React, { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Button } from "@/shared/ui";
import { getCroppedBlob } from "@/shared/lib/cropImage";

export type ImageCropModalProps = {
  image: string;
  aspect: number;
  cropShape?: "rect" | "round";
  maxEdge?: number;
  subtitle?: string;
  onCancel: () => void;
  onComplete: (file: File) => void;
};

export function ImageCropModal({
  image,
  aspect,
  cropShape = "rect",
  maxEdge = 1200,
  subtitle = "Drag, zoom, or rotate before saving.",
  onCancel,
  onComplete,
}: ImageCropModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const save = async () => {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(image, croppedAreaPixels, rotation, maxEdge);
      onComplete(new File([blob], "image.webp", { type: "image/webp" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(11,18,32,.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4, 16px)",
      }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          borderRadius: "var(--r-lg)",
          padding: "var(--space-5, 20px)",
          boxShadow: "var(--sh-3)",
          outline: "none",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ marginBottom: "var(--space-4, 16px)" }}>
          <h2
            style={{
              margin: 0,
              color: "var(--blue-deep)",
              fontSize: "1.125rem",
              fontWeight: 800,
            }}
          >
            Crop image
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
            {subtitle}
          </p>
        </div>

        <div
          style={{
            position: "relative",
            height: "60vh",
            minHeight: 320,
            overflow: "hidden",
            borderRadius: "var(--r-md)",
            background: "var(--ink-900)",
          }}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: "var(--space-4, 16px)" }}>
          <label
            htmlFor="image-crop-zoom"
            style={{ color: "var(--ink-600)", fontSize: ".75rem", fontWeight: 700 }}
          >
            Zoom
          </label>
          <input
            id="image-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={{ width: "100%", accentColor: "var(--blue)" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: "var(--space-5, 20px)",
          }}
        >
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            Rotate
          </Button>
          <Button variant="tertiary" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!croppedAreaPixels}
            onClick={() => void save()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
