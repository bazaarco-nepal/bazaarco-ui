"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui";

// Destructive confirmation for a seller deleting one of their product videos.
// Mirrors ProductDeleteConfirmModal so the seller console keeps one
// confirm-dialog look; the only red affordance is the delete itself.
export function VideoDeleteConfirmModal({
  open,
  pending,
  productLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending: boolean;
  productLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel, pending]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-delete-title"
      onClick={() => {
        if (!pending) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 700,
        background: "rgba(11,18,32,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <style>{`
        .bz-video-delete__actions { display: flex; gap: 10px; flex-direction: row; }
        @media (max-width: 480px) {
          .bz-video-delete__actions { flex-direction: column-reverse; }
        }
      `}</style>
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-xl)",
          padding: 28,
          width: "100%",
          maxWidth: 420,
          boxShadow: "var(--sh-3)",
        }}
      >
        <h3
          id="video-delete-title"
          style={{
            margin: "0 0 8px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          Delete this video?
        </h3>
        <p
          style={{
            margin: "0 0 22px",
            color: "var(--ink-500)",
            fontSize: ".9375rem",
            lineHeight: 1.55,
          }}
        >
          The video for <strong>{productLabel}</strong> will be permanently removed and buyers will
          no longer see it. This can&rsquo;t be undone.
        </p>

        <div className="bz-video-delete__actions">
          <Button variant="ghost" full disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" full loading={pending} onClick={onConfirm}>
            {pending ? "Deleting…" : "Delete video"}
          </Button>
        </div>
      </div>
    </div>
  );
}
