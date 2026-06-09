"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";

export function LogoutConfirmModal({
  open,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

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

  // Focus the confirm button when the modal opens.
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
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
        .bz-logout-confirm__actions {
          display: flex;
          gap: 10px;
          flex-direction: row;
        }
        @media (max-width: 480px) {
          .bz-logout-confirm__actions { flex-direction: column; }
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
          id="logout-confirm-title"
          style={{
            margin: "0 0 8px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          Log out?
        </h3>
        <p
          style={{
            margin: "0 0 22px",
            color: "var(--ink-500)",
            fontSize: ".9375rem",
            lineHeight: 1.55,
          }}
        >
          Are you sure you want to log out?
        </p>

        <div className="bz-logout-confirm__actions">
          {/* Neutral cancel (stay signed in) vs. red logout confirm — only the
              destructive action is red, so the two no longer read the same. */}
          <Button variant="ghost" full disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" full loading={pending} onClick={onConfirm}>
            {pending ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </div>
    </div>
  );
}
