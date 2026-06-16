"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Icon, Button, ApiState } from "@/components/ui";
import { useBazaarStore } from "@/store/bazaar-store";
import { useSellerOrganization } from "@/hooks/use-seller";
import { useBz } from "@/components/common";
import { SellerHelpBar, SellerPageHeader } from "../_shared/components";

export function SellerVerificationTimeline() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const setReuploadIntent = useBazaarStore((s) => s.setSellerReuploadIntent);
  const { data: organization, isLoading, isError, error } = useSellerOrganization();
  const verification = organization?.verification;
  const status = verification?.status ?? "none";

  // Re-upload sends the seller back through the document + details flow and on to
  // a fresh admin review. The intent flag lets onboarding restart even while a
  // submission is still pending (otherwise it just shows the "in review" screen).
  const startReupload = () => {
    setReuploadIntent(true);
    nav("s-onboarding");
  };

  const formatWhen = (iso: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const submitted = status !== "none";
  const reviewed = status === "approved" || status === "rejected";

  const STATUS_META = {
    none: { label: t("seller.kyc.statusNotStarted"), bg: "var(--line-200)", fg: "var(--ink-600)" },
    pending: {
      label: t("seller.kyc.statusPending"),
      bg: "rgba(247,127,0,.14)",
      fg: "var(--saffron)",
    },
    approved: {
      label: t("seller.kyc.statusApproved"),
      bg: "rgba(22,163,74,.14)",
      fg: "var(--success)",
    },
    rejected: { label: t("seller.kyc.statusRejected"), bg: "var(--tint-red-50)", fg: "var(--red)" },
  };
  const meta = STATUS_META[status] ?? STATUS_META.none;

  const milestones = [
    {
      key: "submitted",
      icon: "file",
      en: "KYC application submitted",
      at: verification?.submittedAt,
      state: submitted ? "done" : "todo",
      hint: submitted ? null : "You haven't sent your document yet.",
    },
    {
      key: "review",
      icon: reviewed ? "shieldCheck" : "clock",
      en: reviewed ? "Reviewed by BazaarCo" : "Under review by BazaarCo",
      // No timestamp of its own — review and the decision happen as one event,
      // so the actual time lives on the decision step below. Showing reviewedAt
      // here too would just repeat the same timestamp and read like a bug.
      at: null,
      state: reviewed ? "done" : submitted ? "current" : "todo",
      hint: status === "pending" ? "Usually decided within 1–2 working days." : null,
    },
    {
      key: "decision",
      icon: status === "rejected" ? "x" : "badgeCheck",
      en:
        status === "approved"
          ? "Approved — you can sell"
          : status === "rejected"
            ? "Not approved"
            : "Approval",
      at: reviewed ? verification?.reviewedAt : null,
      state: status === "approved" ? "done" : status === "rejected" ? "done-red" : "todo",
      note: status === "rejected" ? verification?.note : null,
    },
  ];

  const dotFor = (state: string) => {
    switch (state) {
      case "done":
        return { bg: "rgba(22,163,74,.12)", fg: "var(--success)" };
      case "done-red":
        return { bg: "var(--tint-red-50)", fg: "var(--red)" };
      case "current":
        return { bg: "rgba(247,127,0,.14)", fg: "var(--saffron)" };
      default:
        return { bg: "var(--line-200)", fg: "var(--ink-400)" };
    }
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page">
        <SellerHelpBar />
        {/* Full-width status page — the timeline and summary span the whole
           seller content area rather than sitting in a narrow column. */}
        <div className="bz-kyc">
          {/* Header — the status pill lives inline beside the title, since the
             current state is the single most important thing on this page. */}
          <SellerPageHeader
            title={t("seller.kyc.title")}
            subtitle={
              status === "approved"
                ? "Your seller account is fully verified."
                : "Track your document verification status."
            }
            actions={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: meta.bg,
                  color: meta.fg,
                  fontWeight: 800,
                  fontSize: ".8125rem",
                  padding: "6px 12px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {meta.label}
              </span>
            }
          />

          {/* Vertical timeline */}
          <div
            style={{
              marginTop: 18,
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: "22px 20px",
            }}
          >
            {milestones.map((m, i) => {
              const dot = dotFor(m.state);
              const last = i === milestones.length - 1;
              const when = formatWhen(m.at ?? "");
              const dim = m.state === "todo";
              return (
                <div key={m.key} style={{ display: "flex", gap: 14 }}>
                  {/* rail: dot + connector line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: dot.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={m.icon} size={19} color={dot.fg} />
                    </div>
                    {!last && (
                      <div
                        style={{
                          flex: 1,
                          width: 2,
                          minHeight: 26,
                          margin: "4px 0",
                          background:
                            m.state === "todo" ? "var(--line-200)" : "rgba(22,163,74,.35)",
                        }}
                      />
                    )}
                  </div>
                  {/* content */}
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 20 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: ".9375rem",
                        color: dim ? "var(--ink-500)" : "var(--ink-900)",
                      }}
                    >
                      {m.en}
                    </div>
                    {when ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 6,
                          fontSize: ".8125rem",
                          color: "var(--ink-600)",
                          fontWeight: 600,
                        }}
                      >
                        <Icon name="clock" size={13} color="var(--ink-400)" />
                        <span className="tnum">{when}</span>
                      </div>
                    ) : m.state === "current" ? (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: ".8125rem",
                          color: "var(--saffron)",
                          fontWeight: 700,
                        }}
                      >
                        In progress
                      </div>
                    ) : null}
                    {m.hint && (
                      <div style={{ marginTop: 4, fontSize: ".8125rem", color: "var(--ink-500)" }}>
                        {m.hint}
                      </div>
                    )}
                    {m.note && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "10px 12px",
                          background: "var(--tint-red-50)",
                          border: "1px solid rgba(230,57,70,.25)",
                          borderRadius: "var(--r-md)",
                          fontSize: ".8125rem",
                          color: "var(--red)",
                        }}
                      >
                        <strong>Reason:</strong> {m.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Approved isn't a dead end — tell the seller what they've unlocked and
             point them straight at the next useful action. */}
          {status === "approved" && (
            <div
              style={{
                marginTop: 16,
                background: "rgba(22,163,74,.06)",
                border: "1px solid rgba(22,163,74,.25)",
                borderRadius: "var(--r-lg)",
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="badgeCheck" size={20} color="var(--success)" />
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink-900)" }}>
                  You&apos;re verified — your store is live
                </div>
              </div>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: ".875rem",
                  color: "var(--ink-600)",
                  lineHeight: 1.5,
                }}
              >
                Buyers can now find your store and place orders. Here&apos;s what you can do:
              </p>
              <ul
                style={{
                  margin: "10px 0 0",
                  padding: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: 8,
                }}
              >
                {[
                  "List unlimited products",
                  "Upload product videos",
                  "Receive orders and payouts",
                ].map((line) => (
                  <li
                    key={line}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: ".875rem",
                      color: "var(--ink-700)",
                    }}
                  >
                    <Icon name="check" size={15} color="var(--success)" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action — finish, re-submit, or get started depending on status. The
             buttons size to their label (full-width only on mobile, see .bz-kyc-actions). */}
          {status === "none" && (
            <div className="bz-kyc-actions">
              <Button variant="primary" size="lg" onClick={() => nav("s-onboarding")}>
                Start verification
              </Button>
            </div>
          )}
          {status === "rejected" && (
            <div className="bz-kyc-actions">
              <Button variant="primary" size="lg" onClick={startReupload}>
                Re-upload document
              </Button>
            </div>
          )}
          {/* Pending sellers can still fix a wrong upload — replacing the document
             sends a fresh submission back to admin review. Lower emphasis, since
             most pending sellers just need to wait. */}
          {status === "pending" && (
            <div className="bz-kyc-actions" style={{ flexWrap: "wrap" }}>
              <Button variant="secondary" size="lg" onClick={startReupload}>
                Re-upload document
              </Button>
              <span
                style={{
                  fontSize: ".8125rem",
                  color: "var(--ink-500)",
                  alignSelf: "center",
                }}
              >
                Uploaded the wrong document? Re-upload to replace your pending submission.
              </span>
            </div>
          )}
          {status === "approved" && (
            <div className="bz-kyc-actions">
              <Button variant="primary" size="lg" onClick={() => nav("s-add")}>
                Start listing products
              </Button>
              <Button variant="ghost" size="lg" onClick={() => nav("s-dashboard")}>
                Open dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </ApiState>
  );
}
