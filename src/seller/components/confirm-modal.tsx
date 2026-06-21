"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";

export function ConfirmModal({
  open,
  pending,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  cancelLabel,
  icon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending?: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: "danger" | "primary";
  cancelLabel?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
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
      aria-labelledby="bz-confirm-title"
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
        .bz-confirm__actions { display: flex; gap: 10px; flex-direction: row; }
        @media (max-width: 480px) {
          .bz-confirm__actions { flex-direction: column-reverse; }
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
        {icon && (
          <div style={{ marginBottom: 12 }}>
            <SellerIcon
              name={icon}
              size={28}
              color={confirmVariant === "danger" ? "var(--danger)" : "var(--blue)"}
            />
          </div>
        )}
        <h3
          id="bz-confirm-title"
          style={{
            margin: "0 0 8px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          {title}
        </h3>
        <div
          style={{
            margin: "0 0 22px",
            color: "var(--ink-500)",
            fontSize: ".9375rem",
            lineHeight: 1.55,
          }}
        >
          {message}
        </div>

        <div className="bz-confirm__actions">
          <Button variant="ghost" full disabled={pending} onClick={onCancel}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button variant={confirmVariant} full loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
