"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { useBazaarStore } from "@/store/bazaar-store";
import type { Locale } from "@/i18n";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const locale = useBazaarStore((s) => s.locale);
  const setLocale = useBazaarStore((s) => s.setLocale);

  const set = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      role="group"
      aria-label={t("language.switchAria")}
      className="bz-lang-toggle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 4 : 6,
        padding: compact ? "4px 6px" : "5px 8px",
        borderRadius: "var(--r-full)",
        border: "1px solid var(--line-200)",
        background: "#fff",
      }}
    >
      {!compact && (
        <span
          style={{
            fontSize: ".6875rem",
            fontWeight: 700,
            color: "var(--ink-400)",
            letterSpacing: ".04em",
            textTransform: "uppercase",
            paddingLeft: 4,
          }}
        >
          {t("language.label")}
        </span>
      )}
      <button
        type="button"
        onClick={() => set("en")}
        aria-pressed={locale === "en"}
        style={toggleStyle(locale === "en")}
      >
        EN
      </button>
      <span style={{ color: "var(--line-200)", fontSize: ".75rem" }}>|</span>
      <button
        type="button"
        onClick={() => set("ne")}
        aria-pressed={locale === "ne"}
        style={toggleStyle(locale === "ne")}
      >
        ने
      </button>
    </div>
  );
}

function toggleStyle(active: boolean): CSSProperties {
  return {
    background: active ? "var(--tint-blue-50)" : "transparent",
    border: "none",
    borderRadius: "var(--r-full)",
    color: active ? "var(--blue-deep)" : "var(--ink-500)",
    cursor: "pointer",
    fontSize: ".75rem",
    fontWeight: 800,
    padding: "4px 8px",
    lineHeight: 1,
  };
}
