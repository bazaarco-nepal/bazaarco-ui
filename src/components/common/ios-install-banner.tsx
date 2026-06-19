"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, IconButton } from "@/components/ui";

const DISMISSED_KEY = "bazaarco:ios-install-dismissed";

// iOS Safari is the only place that can't show a programmatic install prompt —
// the user must tap Share → Add to Home Screen. So we only nudge there, and
// only when not already installed (standalone) and not previously dismissed.
function shouldShow(): boolean {
  const ua = navigator.userAgent;
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as desktop Safari; touch points give it away.
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;

  // Chrome/Firefox/Edge on iOS render "...iOS" tokens and can't Add to Home Screen.
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  if (!isSafari) return false;

  const isStandalone =
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches;
  if (isStandalone) return false;

  return localStorage.getItem(DISMISSED_KEY) !== "1";
}

export function IosInstallBanner() {
  const { t } = useTranslation();
  // Stays false on the server and first client paint to avoid a hydration
  // mismatch; the effect flips it on once we've checked the real environment.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldShow()) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t("pwa.iosInstallTitle")}
      className="fade-up"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        zIndex: 640,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#fff",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-xl)",
        boxShadow: "0 8px 28px rgba(11,18,32,.16)",
        padding: 14,
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--tint-blue-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="share" size={22} color="var(--blue)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: ".9375rem", fontWeight: 800, color: "var(--ink-900)" }}>
          {t("pwa.iosInstallTitle")}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: ".8125rem",
            color: "var(--ink-500)",
            lineHeight: 1.45,
          }}
        >
          {t("pwa.iosInstallBody")}
        </p>
      </div>
      <IconButton name="x" label={t("common.close")} onClick={dismiss} />
    </div>
  );
}
