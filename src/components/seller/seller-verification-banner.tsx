"use client";

import { useTranslation } from "react-i18next";

import { Icon, Button } from "@/components/ui";
import type { SellerVerificationStatus } from "@/services/api/seller-verification";

export function SellerVerificationBanner({
  status,
}: {
  status: SellerVerificationStatus;
  note?: string | null;
}) {
  const { t } = useTranslation();
  if (status === "approved") return null;

  const isRejected = status === "rejected";
  const isNone = status === "none";
  const accent = isRejected ? "var(--danger)" : "var(--warning)";

  return (
    <div
      role="alert"
      style={{
        margin: "0 0 16px",
        padding: "12px 14px",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--line-200)",
        borderInlineStart: `3px solid ${accent}`,
        background: "var(--card)",
        boxShadow: "var(--sh-1)",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <Icon
        name={isRejected ? "flag" : "clock"}
        size={18}
        color={accent}
        style={{ flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: ".875rem", color: "var(--ink-900)" }}>
          {isRejected
            ? t("seller.verificationBanner.notApproved")
            : isNone
              ? t("seller.verificationBanner.documentRequired")
              : t("seller.verificationBanner.beingReviewed")}
        </span>
      </div>
    </div>
  );
}

export function SellerVerificationBlocked({
  actionLabel,
  status,
  note,
  onAction,
}: {
  actionLabel: string;
  status: SellerVerificationStatus;
  note?: string | null;
  onAction?: () => void;
}) {
  const { t } = useTranslation();
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  const showAction = !isPending && !!onAction;
  const accent = isRejected ? "var(--danger)" : isPending ? "var(--warning)" : "var(--blue)";

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-2)",
        padding: "32px 24px",
        textAlign: "center",
        marginBottom: 18,
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--r-lg)",
          background: `color-mix(in srgb, ${accent} 14%, #fff)`,
          color: accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon
          name={isPending ? "clock" : isRejected ? "flag" : "shieldCheck"}
          size={26}
          color={accent}
        />
      </span>
      <h2
        style={{
          margin: "0 0 6px",
          fontSize: "1.125rem",
          fontWeight: 800,
          color: "var(--ink-900)",
        }}
      >
        {isPending
          ? t("seller.verificationBanner.underReview")
          : isRejected
            ? t("seller.verificationBanner.notApproved")
            : t("seller.verificationBanner.required")}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: ".875rem",
          color: "var(--ink-600)",
          maxWidth: 360,
          marginInline: "auto",
          lineHeight: 1.5,
        }}
      >
        {isPending
          ? t("seller.verificationBanner.pendingMessage")
          : isRejected
            ? (note ?? t("seller.verificationBanner.rejectedFallback"))
            : t("seller.verificationBanner.completeToAction", { action: actionLabel })}
      </p>
      {showAction && (
        <div style={{ marginTop: 18 }}>
          <Button variant="secondary" onClick={onAction}>
            {isRejected
              ? t("seller.verificationBanner.reupload")
              : t("seller.verificationBanner.verify")}
          </Button>
        </div>
      )}
    </div>
  );
}
