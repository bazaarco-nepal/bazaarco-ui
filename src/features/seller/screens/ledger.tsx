"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Chip, ChipGroup, ApiState } from "@/components/ui";
import { formatNPR } from "@/lib/money";
import { useSellerLedger } from "@/hooks/use-seller";
import { pathFromScreen } from "@/config/routes";
import { SellerHelpBar, SellerPageHeader, Card } from "../_shared/components";

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
      bg: "color-mix(in srgb, var(--success) 10%, transparent)",
    },
    sending: { en: "Sending", color: "var(--saffron)", bg: "rgba(247,127,0,.1)" },
    held: {
      en: "On hold",
      color: "var(--danger)",
      bg: "color-mix(in srgb, var(--danger) 10%, transparent)",
    },
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-seller-ledger-print bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px 28px 100px",
        }}
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

        <Card title="Payout history">
          <div
            className="bz-dtable"
            style={{ "--bz-dtable-cols": "1.2fr 1fr 1fr 1fr auto" } as React.CSSProperties}
          >
            <div className="bz-dtable__head">
              <span>Date</span>
              <span>Sold</span>
              <span>Fee</span>
              <span>Net</span>
              <span>Status</span>
            </div>
            {rows.length === 0 && (
              <p
                style={{
                  padding: "20px 2px",
                  textAlign: "center",
                  color: "var(--ink-500)",
                  fontSize: ".875rem",
                  margin: 0,
                }}
              >
                No payouts yet. History appears here after your first sale.
              </p>
            )}
            {rows.map((r, i) => {
              const s = statusLabel[r.status as keyof typeof statusLabel];
              const tone =
                r.status === "received" ? "success" : r.status === "sending" ? "saffron" : "red";
              return (
                <div className="bz-dtable__row" key={i}>
                  <div>
                    <span className="bz-dtable__lab">Date</span>
                    <span style={{ fontWeight: 600 }}>{r.date}</span>
                  </div>
                  <div>
                    <span className="bz-dtable__lab">Sold</span>
                    <span className="tnum">{formatNPR(Number(r.cash))}</span>
                  </div>
                  <div>
                    <span className="bz-dtable__lab">Fee</span>
                    <span className="tnum" style={{ color: "var(--danger)" }}>
                      − {formatNPR(Number(r.fee))}
                    </span>
                  </div>
                  <div>
                    <span className="bz-dtable__lab">Net</span>
                    <span className="tnum" style={{ color: "var(--success)", fontWeight: 600 }}>
                      {formatNPR(Number(r.net))}
                    </span>
                  </div>
                  <div>
                    <span className="bz-dtable__lab">Status</span>
                    <Chip tone={tone}>{s.en}</Chip>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

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
