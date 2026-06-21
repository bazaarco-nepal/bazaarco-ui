"use client";

import { Button, Icon } from "@/shared/ui";

/* Friendly, customer-centric maintenance message shown whenever a feature breaks
   or the site is intentionally down. One component, two variants:
   - "page"   → full-page takeover (global maintenance + critical error.tsx)
   - "inline" → compact card for a single crashed widget (LocalErrorBoundary)
   Copy is English-only and hardcoded (NOT i18n): this renders inside global-error
   too, which is outside I18nProvider, so useTranslation() would fail there. */

const HEADING = "Making Bazaarco better for you";
const BODY =
  "Bazaarco is taking a quick break for maintenance. We are working hard to give you a better shopping experience. Please check back in a few minutes!";

// Single source of truth for support contacts. wa.me wants digits only.
const SUPPORT_EMAIL = "support@bazaarconepal.com";
const SUPPORT_WHATSAPP_DISPLAY = "+977 9700053075";
const SUPPORT_WHATSAPP_HREF = "https://wa.me/9779700053075";

interface MaintenanceMessageProps {
  variant?: "page" | "inline";
  /** Page variant: wired to error.tsx reset(); falls back to a full reload. */
  onRefresh?: () => void;
}

export function MaintenanceMessage({ variant = "page", onRefresh }: MaintenanceMessageProps) {
  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else if (typeof window !== "undefined") window.location.reload();
  };

  if (variant === "inline") {
    return (
      <div
        role="alert"
        style={{
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          background: "var(--card)",
          padding: "20px 18px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontWeight: "var(--w-heading)", color: "var(--ink-900)" }}>
          {HEADING}
        </p>
        <p
          style={{
            margin: "6px 0 14px",
            fontSize: "var(--fs-caption)",
            color: "var(--ink-500)",
            lineHeight: "var(--lh-normal)",
          }}
        >
          {BODY}
        </p>
        <Button variant="secondary" size="sm" icon="refresh" onClick={handleRefresh}>
          Refresh Page
        </Button>
        <SupportBlock compact />
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="container"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        paddingBlock: "var(--space-2xl)",
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "var(--r-full)",
            background: "var(--tint-blue-50)",
            color: "var(--blue)",
            marginBottom: "var(--space-md)",
          }}
        >
          <Icon name="settings" size={28} />
        </span>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h1)",
            fontWeight: "var(--w-heading)",
            color: "var(--ink-900)",
          }}
        >
          {HEADING}
        </h1>
        <p
          style={{
            margin: "var(--space-sm) 0 var(--space-lg)",
            fontSize: "var(--fs-body)",
            color: "var(--ink-500)",
            lineHeight: "var(--lh-normal)",
          }}
        >
          {BODY}
        </p>
        <Button variant="primary" size="lg" icon="refresh" onClick={handleRefresh}>
          Refresh Page
        </Button>
        <SupportBlock />
      </div>
    </div>
  );
}

function SupportBlock({ compact = false }: { compact?: boolean }) {
  const linkStyle: React.CSSProperties = {
    color: "var(--blue)",
    textDecoration: "none",
    fontWeight: "var(--w-emphasis)",
    whiteSpace: "nowrap",
  };
  return (
    <div
      style={{
        marginTop: compact ? "var(--space-sm)" : "var(--space-xl)",
        paddingTop: compact ? "var(--space-sm)" : "var(--space-lg)",
        borderTop: "1px solid var(--line-200)",
        fontSize: "var(--fs-caption)",
        color: "var(--ink-500)",
        lineHeight: "var(--lh-normal)",
      }}
    >
      <p style={{ margin: 0, fontWeight: "var(--w-emphasis)", color: "var(--ink-700)" }}>
        Need help right away?
      </p>
      <p style={{ margin: "6px 0 0" }}>
        📩 Email:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={linkStyle}>
          {SUPPORT_EMAIL}
        </a>
      </p>
      <p style={{ margin: "4px 0 0" }}>
        💬 WhatsApp:{" "}
        <a href={SUPPORT_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {SUPPORT_WHATSAPP_DISPLAY}
        </a>
      </p>
    </div>
  );
}
