"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";

export function LogoutConfirmModal({
  open,
  pending,
  onConfirm,
  onCancel,
  skin,
}: {
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // The seller console renders this inside the Fluent skin; pass "fluent" to get
  // the enterprise dialog look (hairline card, 8px radius, calmer type, a
  // neutral-outline Cancel). The buyer leaves this unset and keeps its own look.
  skin?: "fluent";
}) {
  const { t } = useTranslation();
  const fluent = skin === "fluent";
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
      data-skin={skin}
      onClick={() => {
        if (!pending) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 700,
        background: fluent ? "rgba(0,0,0,.4)" : "rgba(11,18,32,.6)",
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
          background: "var(--card, #fff)",
          borderRadius: fluent ? "var(--r-lg)" : "var(--r-xl)",
          border: fluent ? "1px solid var(--line-200)" : "none",
          padding: fluent ? 24 : 28,
          width: "100%",
          maxWidth: 420,
          boxShadow: "var(--sh-3)",
        }}
      >
        <h3
          id="logout-confirm-title"
          style={{
            margin: "0 0 8px",
            fontSize: fluent ? "1.25rem" : "1.125rem",
            fontWeight: fluent ? 600 : 800,
            color: "var(--ink-900)",
          }}
        >
          {t("common.logout.title")}
        </h3>
        <p
          style={{
            margin: "0 0 22px",
            color: "var(--ink-500)",
            fontSize: ".9375rem",
            lineHeight: 1.55,
          }}
        >
          {t("common.logout.message")}
        </p>

        <div className="bz-logout-confirm__actions">
          {/* Neutral cancel (stay signed in) vs. red logout confirm — only the
              destructive action is red, so the two no longer read the same.
              Fluent prefers a visible neutral-outline button over a bare ghost. */}
          <Button
            variant={fluent ? "secondary" : "ghost"}
            full
            disabled={pending}
            onClick={onCancel}
          >
            {t("common.cancel")}
          </Button>
          <Button variant="danger" full loading={pending} onClick={onConfirm}>
            {pending ? t("common.logout.pending") : t("nav.logOut")}
          </Button>
        </div>
      </div>
    </div>
  );
}
