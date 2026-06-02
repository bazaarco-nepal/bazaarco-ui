"use client";

import { Icon, Button } from "@/components/ui";
import type { SellerVerificationStatus } from "@/services/api/seller-verification";

export function SellerVerificationBanner({
  status,
  note,
}: {
  status: SellerVerificationStatus;
  note?: string | null;
}) {
  if (status === "approved") return null;

  const isRejected = status === "rejected";
  const isNone = status === "none";

  return (
    <div
      role="alert"
      style={{
        margin: "0 0 16px",
        padding: "14px 16px",
        borderRadius: "var(--r-md)",
        border: `1.5px solid ${isRejected ? "var(--red)" : "var(--saffron)"}`,
        background: isRejected ? "rgba(220,38,38,.06)" : "rgba(247,127,0,.08)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <Icon
        name={isRejected ? "bell" : "shieldCheck"}
        size={22}
        color={isRejected ? "var(--red)" : "var(--saffron)"}
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: ".9375rem", color: "var(--blue-deep)" }}>
          {isRejected
            ? "Verification not approved"
            : isNone
              ? "Verification document required"
              : "Pending verification from BazaarCo admin"}
        </div>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: ".8125rem",
            color: "var(--ink-700)",
            lineHeight: 1.45,
          }}
        >
          {isRejected
            ? (note ??
              "Your NID/PAN could not be verified. Upload a clearer document from onboarding or contact support.")
            : isNone
              ? "Upload your NID or PAN in seller onboarding before you can add products or product videos."
              : "Your NID or PAN was submitted. BazaarCo admin will review it manually. You cannot add products or upload product videos until approved."}
        </p>
        <p
          className="ne"
          style={{ margin: "6px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}
        >
          {isRejected
            ? "प्रमाणीकरण अस्वीकृत — कागजात पुन: अपलोड गर्नुहोस्"
            : isNone
              ? "कागजात अपलोड गर्नुहोस्"
              : "प्रमाणीकरण पर्खिरहेको छ — एडमिनले जाँच गर्नेछ"}
        </p>
      </div>
    </div>
  );
}

/**
 * Status-aware "you can't do this yet" block shown on gated pages (add product,
 * upload video). It reflects the saved verification state so a seller who has
 * already submitted sees a calm "in review" message — not a prompt to start
 * the KYC flow over again.
 *
 * - none     → "Verification required" + Complete-verification action
 * - pending  → "Verification in review" + NO action (resubmitting is blocked
 *              until the admin reviews it)
 * - rejected → "Verification not approved" + note + Re-upload action
 *
 * `onAction` is the entry into the KYC flow; the parent passes it only when an
 * action makes sense (it is ignored for the pending state).
 */
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
  const isPending = status === "pending";
  const isRejected = status === "rejected";

  const title = isPending
    ? "Verification in review"
    : isRejected
      ? "Verification not approved"
      : "Verification required";

  const body = isPending
    ? `Your NID or PAN is submitted. You'll be able to ${actionLabel} once BazaarCo admin approves it.`
    : isRejected
      ? (note ?? "Your NID or PAN could not be verified. Upload a clearer document to try again.")
      : `You cannot ${actionLabel} until BazaarCo admin approves your NID or PAN. Check the warning banner above for status.`;

  const subNe = isPending
    ? "प्रमाणीकरण पर्खिरहेको छ — एडमिनले जाँच गर्नेछ"
    : isRejected
      ? "प्रमाणीकरण अस्वीकृत — कागजात पुन: अपलोड गर्नुहोस्"
      : "कागजात अपलोड गर्नुहोस्";

  // Pending sellers have nothing to do but wait — hide the action entirely.
  const showAction = !isPending && !!onAction;

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        padding: 24,
        textAlign: "center",
        marginBottom: 18,
      }}
    >
      <Icon
        name={isRejected ? "bell" : "shieldCheck"}
        size={36}
        color={isRejected ? "var(--red)" : "var(--saffron)"}
      />
      <h2
        style={{
          margin: "12px 0 6px",
          fontSize: "1.125rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: ".875rem",
          color: "var(--ink-600)",
          maxWidth: 420,
          marginInline: "auto",
        }}
      >
        {body}
      </p>
      <p className="ne" style={{ margin: "8px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>
        {subNe}
      </p>
      {showAction && (
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={onAction}>
            {isRejected
              ? "Re-upload document · कागजात फेरि पठाउनुहोस्"
              : "Complete verification · प्रमाणीकरण"}
          </Button>
        </div>
      )}
    </div>
  );
}
