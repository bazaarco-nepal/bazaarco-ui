"use client";

import { useEffect } from "react";
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

/** Full-screen zoom view of the gallery, synced to the PDP's photo index. */
export function ImageLightbox({ images, index, alt, onIndex, onClose }: ImageLightboxProps) {
  const count = images.length;
  const go = (dir: number) => onIndex((index + dir + count) % count);

  // Arrow-key + escape navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) go(-1);
      else if (e.key === "ArrowRight" && count > 1) go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

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
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          minHeight: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {count > 1 && (
          <button type="button" aria-label="Previous photo" onClick={() => go(-1)} style={navBtn}>
            <Icon name="chevronLeft" size={22} />
          </button>
        )}
        <img
          src={images[Math.min(index, count - 1)]}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "var(--r-md)",
          }}
        />
        {count > 1 && (
          <button type="button" aria-label="Next photo" onClick={() => go(1)} style={navBtn}>
            <Icon name="chevronRight" size={22} />
          </button>
        )}
      </div>

      {count > 1 && (
        <div
          style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              aria-label={`View photo ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => onIndex(i)}
              style={{
                width: 52,
                height: 64,
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
                border: `2px solid ${i === index ? "#fff" : "transparent"}`,
                cursor: "pointer",
                padding: 0,
                background: "none",
                opacity: i === index ? 1 : 0.6,
              }}
            >
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
