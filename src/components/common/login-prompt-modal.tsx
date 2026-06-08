"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
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
