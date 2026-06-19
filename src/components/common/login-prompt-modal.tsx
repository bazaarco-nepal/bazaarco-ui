"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icon, Button } from "@/components/ui";

export function LoginPromptModal({
  open,
  message,
  onClose,
  onSignIn,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
  onSignIn: () => void;
}) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      trapFocus(e);
    };
    document.addEventListener("keydown", onKey);
    const firstBtn = dialogRef.current?.querySelector<HTMLElement>("button");
    firstBtn?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, trapFocus]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 650,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-xl)",
          width: 400,
          maxWidth: "100%",
          padding: 28,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "var(--tint-blue-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon name="lock" size={26} color="var(--blue)" />
        </div>
        <h2
          id="login-prompt-title"
          style={{
            margin: "0 0 8px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          {t("auth.pleaseSignIn")}
        </h2>
        <p
          style={{
            margin: "0 0 22px",
            color: "var(--ink-500)",
            fontSize: ".9375rem",
            lineHeight: 1.55,
          }}
        >
          {message}
        </p>
        <Button variant="primary" full size="lg" onClick={onSignIn}>
          {t("auth.signIn")}
        </Button>
        <Button variant="ghost" full style={{ marginTop: 10 }} onClick={onClose}>
          {t("common.notNow")}
        </Button>
      </div>
    </div>
  );
}
