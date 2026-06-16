"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, ChipGroup, ApiState } from "@/components/ui";
import { formatNPR } from "@/lib/money";
import { useSellerLedger } from "@/hooks/use-seller";
import { pathFromScreen } from "@/config/routes";
import { SellerHelpBar, SellerPageHeader } from "../_shared/components";


/* ---------- 4.6 Payouts Ledger ---------- */
export function SellerLedger() {
  const { t } = useTranslation();
  const { data: ledger, isLoading, isError, error } = useSellerLedger();
  const rows = ledger?.rows ?? [];
  const supportEmail = "support@bazaarconepal.com";
  const supportPhone = "+977 9700053075";
  const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "Seller payout support",
  )}&body=${encodeURIComponent("Hi BazaarCo team,\n\nI need help with my seller payouts.\n\n")}`;
  const supportWhatsapp = "https://wa.me/9779700053075";
  const saveAsPdf = () => {
    if (typeof window === "undefined") return;
    window.print();
  };
  const talkToSupport = () => {
    if (typeof window === "undefined") return;
    const message = `Hi BazaarCo team,\n\nI need help with my seller payouts.`;
    const whatsappUrl = `https://wa.me/9779700053075?text=${encodeURIComponent(message)}`;
    const choice = window.confirm(
      `Contact support via:\n\n[OK] WhatsApp: ${supportPhone}\n\n[Cancel] Email: ${supportEmail}`,
    );
    if (choice) {
      window.open(whatsappUrl, "_blank");
    } else {
      window.location.href = supportMailto;
    }
  };
  const statusLabel = {
    received: {
      en: "Received",
      color: "var(--success)",
      bg: "rgba(22,163,74,.1)",
    },
    sending: { en: "Sending", color: "var(--saffron)", bg: "rgba(247,127,0,.1)" },
    held: { en: "On hold", color: "var(--danger)", bg: "rgba(220,38,38,.1)" },
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-seller-ledger-print bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <div className="bz-no-print">
          <SellerHelpBar />
        </div>

        <div className="bz-no-print">
          <SellerPageHeader
            title={t("seller.ledger.title")}
            subtitle={t("seller.ledger.subtitle")}
            actions={
              <Button variant="ghost" href={pathFromScreen("s-dashboard")} icon="chevronLeft">
                {t("seller.common.back")}
              </Button>
            }
          />
        </div>

        <div className="bz-no-print" style={{ marginBottom: 14 }}>
          <ChipGroup
            options={[
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
              { value: "all", label: "All time" },
            ]}
            value="week"
            onChange={() => {}}
          />
        </div>

        <div
          style={{
            background: "#fff",
            border: "2px solid var(--ink-900)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--ink-900)",
              color: "#fff",
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: ".8125rem",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Payout history
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--line-100)" }}>
                {["Date", "Sold", "Fee", "Net", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: ".75rem",
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "var(--ink-500)",
                      fontSize: ".875rem",
                    }}
                  >
                    No payouts yet. History appears here after your first sale.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const s = statusLabel[r.status as keyof typeof statusLabel];
                return (
                  <tr key={i} style={{ borderTop: "1px solid var(--line-200)" }}>
                    <td style={{ padding: "14px 12px", fontWeight: 700 }}>{r.date}</td>
                    <td className="tnum" style={{ padding: "14px 12px" }}>
                      {formatNPR(Number(r.cash))}
                    </td>
                    <td className="tnum" style={{ padding: "14px 12px", color: "var(--danger)" }}>
                      − {formatNPR(Number(r.fee))}
                    </td>
                    <td
                      className="tnum"
                      style={{ padding: "14px 12px", color: "var(--success)", fontWeight: 800 }}
                    >
                      {formatNPR(Number(r.net))}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: s.bg,
                          color: s.color,
                          fontWeight: 700,
                          fontSize: ".75rem",
                        }}
                      >
                        {s.en}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bz-no-print" style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <Button variant="ghost" full icon="image" onClick={saveAsPdf}>
            Save as PDF
          </Button>
          <Button variant="ghost" full icon="phone" onClick={talkToSupport}>
            Talk to support
          </Button>
        </div>
      </div>
    </ApiState>
  );
}
