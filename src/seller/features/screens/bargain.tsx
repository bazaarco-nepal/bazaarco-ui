"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Chip, ApiState } from "@/components/ui";
import { bargainExpiryLabel } from "@/lib/bargain-expiry";
import { formatNPR } from "@/lib/money";
import {
  useAcceptBargainOffer,
  useRejectBargainOffer,
  useCounterBargainOffer,
} from "@/shared/hooks/use-bargains";
import { useSellerBargains, type SellerBargainOffer } from "@/seller/hooks/use-seller";
import { BuyerAvatar } from "@/components/common";
import { ApiRequestError } from "@/services/api/http";
import { toast } from "@/lib/toast";
import { bargainStatus } from "../_shared/bargain";
import { SellerHelpBar, SellerPageHeader, SellerEmptyState } from "../_shared/components";

function fmtRs(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "0";
}

/** One row in the seller's bargain inbox. Kept as its own component so each card
 *  can hold the seller's in-progress counter amount without a shared map of state. */
function BargainOfferCard({
  o,
  acceptMutation,
  rejectMutation,
  counterMutation,
}: {
  o: SellerBargainOffer;
  acceptMutation: ReturnType<typeof useAcceptBargainOffer>;
  rejectMutation: ReturnType<typeof useRejectBargainOffer>;
  counterMutation: ReturnType<typeof useCounterBargainOffer>;
}) {
  const status = bargainStatus(o);
  const listed = Number(o.listed) || 0;
  const offered = Number(o.offered ?? o.yourOffer) || 0;
  const saving = Math.max(0, listed - offered);
  // Midpoint between the offer and the listed price — a starting point the
  // seller can edit, never sent on its own.
  const suggestion = Math.round((listed + offered) / 2 / 10) * 10;
  const [countering, setCountering] = useState(false);
  const [counterText, setCounterText] = useState(String(suggestion));

  // Send a counter — either the one-tap suggested amount, or whatever the seller
  // typed into the custom field.
  const sendCounter = async (amountRs?: number) => {
    const amount = amountRs ?? Number(counterText);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter your counter amount");
      return;
    }
    try {
      await counterMutation.mutateAsync({ id: o.id, counter: amount });
      toast.bargain("Counter offer sent");
      setCountering(false);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not send counter");
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${status === "pending" ? "var(--blue)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        padding: 14,
        display: "flex",
        gap: 12,
      }}
    >
      <BuyerAvatar
        src={o.buyerAvatarUrl}
        name={o.buyer}
        size={56}
        fontSize="1.25rem"
        style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {status === "pending" && (
            <Chip tone="red" size="sm" icon="bargain">
              New offer
            </Chip>
          )}
          {status === "countered" && (
            <Chip tone="blue" size="sm" icon="bargain">
              Counter sent
            </Chip>
          )}
          {status === "accepted" && (
            <Chip tone="success" size="sm" icon="check">
              Accepted
            </Chip>
          )}
          {status === "rejected" && (
            <Chip tone="danger" size="sm" icon="x">
              Rejected
            </Chip>
          )}
          {status === "expired" && (
            <Chip tone="neutral" size="sm" icon="clock">
              Expired — no response
            </Chip>
          )}
          {status === "pending" && o.recommendation && (
            <Chip
              tone={
                o.recommendation === "strong"
                  ? "success"
                  : o.recommendation === "fair"
                    ? "saffron"
                    : "neutral"
              }
              size="sm"
            >
              {o.recommendation === "strong"
                ? "Strong offer"
                : o.recommendation === "fair"
                  ? "Fair — consider a counter"
                  : "Close to your floor"}
            </Chip>
          )}
          <span style={{ fontSize: ".7rem", color: "var(--ink-400)", marginLeft: "auto" }}>
            {o.time}
          </span>
        </div>
        {(status === "pending" || status === "countered") &&
          (() => {
            const label = bargainExpiryLabel(o.expiresAt);
            const lapsed = o.expiresAt != null && new Date(o.expiresAt).getTime() <= Date.now();
            if (lapsed)
              return (
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "var(--red)",
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  Offer expired
                </div>
              );
            if (label)
              return (
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "var(--saffron)",
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  {label.replace("Expires in", "Respond within")}
                </div>
              );
            return null;
          })()}
        <div style={{ fontWeight: 600 }}>
          {o.buyer} · {o.city}
        </div>
        <div style={{ fontSize: ".8125rem", color: "var(--ink-700)", marginTop: 2 }}>
          {o.product}
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 6,
            fontSize: ".875rem",
            flexWrap: "wrap",
          }}
        >
          <span>
            Listed:{" "}
            <span
              className="tnum"
              style={{ textDecoration: "line-through", color: "var(--ink-500)" }}
            >
              Rs. {fmtRs(listed)}
            </span>
          </span>
          <span>
            Offer:{" "}
            <span className="tnum" style={{ fontWeight: 600, color: "var(--ink-900)" }}>
              Rs. {fmtRs(offered)}
            </span>
          </span>
          <span className="tnum" style={{ color: "var(--saffron)", fontWeight: 600 }}>
            −Rs. {fmtRs(saving)}
          </span>
        </div>

        {/* Once the seller has countered, the ball is in the buyer's court —
            show what was sent, no further actions until the buyer replies. */}
        {status === "countered" && o.sellerCounter != null && (
          <div style={{ marginTop: 8, fontSize: ".8125rem", color: "var(--ink-600)" }}>
            You countered at{" "}
            <span className="tnum" style={{ fontWeight: 600, color: "var(--ink-900)" }}>
              Rs. {fmtRs(o.sellerCounter)}
            </span>{" "}
            · waiting for the buyer.
          </div>
        )}

        {status === "pending" && !countering && (
          <div style={{ marginTop: 10 }}>
            {/* One tap each: accept, counter at the suggested split, or reject. */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  try {
                    await acceptMutation.mutateAsync(o.id);
                    toast.bargain("Offer accepted");
                  } catch {
                    toast.error("Could not accept offer");
                  }
                }}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={counterMutation.isPending}
                onClick={() => void sendCounter(suggestion)}
              >
                Counter Rs {fmtRs(suggestion)}
              </Button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await rejectMutation.mutateAsync(o.id);
                    toast.bargain("Offer rejected");
                  } catch {
                    toast.error("Could not reject offer");
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: ".75rem",
                  fontWeight: 600,
                  color: "var(--danger)",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Reject
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setCounterText(String(suggestion));
                setCountering(true);
              }}
              style={{
                marginTop: 8,
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: ".75rem",
                fontWeight: 600,
                color: "var(--blue)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Counter a different amount
            </button>
          </div>
        )}

        {status === "pending" && countering && (
          <div style={{ marginTop: 10 }}>
            <label
              style={{
                display: "block",
                fontSize: ".75rem",
                fontWeight: 600,
                color: "var(--ink-600)",
                marginBottom: 6,
              }}
            >
              Your counter offer
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>Rs.</span>
                <input
                  type="number"
                  value={counterText}
                  autoFocus
                  onChange={(e) =>
                    setCounterText(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void sendCounter();
                  }}
                  className="tnum"
                  style={{
                    width: 120,
                    height: 38,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: "0 12px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--ink-900)",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                loading={counterMutation.isPending}
                onClick={() => void sendCounter()}
              >
                Send counter
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCountering(false)}>
                Cancel
              </Button>
            </div>
            <p style={{ fontSize: ".7rem", color: "var(--ink-400)", margin: "6px 0 0" }}>
              Must be at or above your minimum price for this item.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 4.8 Bargaining ---------- */
export function SellerBargain() {
  const { t } = useTranslation();
  const { data: BARGAIN_OFFERS = [], isLoading, isError, error } = useSellerBargains();
  const acceptMutation = useAcceptBargainOffer();
  const rejectMutation = useRejectBargainOffer();
  const counterMutation = useCounterBargainOffer();

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px 28px 100px",
        }}
      >
        <SellerHelpBar />
        <SellerPageHeader
          title={t("seller.bargain.title")}
          subtitle={t("seller.bargain.subtitle")}
        />

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {(() => {
            const offers = BARGAIN_OFFERS as Array<{
              status?: string;
              accepted?: boolean;
              rejected?: boolean;
              listed?: number;
              offered?: number;
              yourOffer?: number;
            }>;
            const total = offers.length;
            const accepted = offers.filter((o) => bargainStatus(o) === "accepted").length;
            const acceptPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
            // Bargaining is amount-based — the saving is what the buyer knocked off
            // the listed price (Rs.), not a percentage.
            const savings = offers
              .map((o) => Math.max(0, Number(o.listed) - Number(o.offered ?? o.yourOffer ?? 0)))
              .filter((s) => s > 0);
            const avgSaving = savings.length
              ? Math.round(savings.reduce((a, b) => a + b, 0) / savings.length)
              : 0;
            const margin = offers
              .filter((o) => bargainStatus(o) === "accepted")
              .reduce(
                (sum, o) =>
                  sum + Math.max(0, Number(o.listed) - Number(o.offered ?? o.yourOffer ?? 0)),
                0,
              );
            return [
              { v: String(total), k: "Offers this week", c: "var(--blue)" },
              { v: total > 0 ? `${acceptPct}%` : "0%", k: "You accepted", c: "var(--success)" },
              {
                v: formatNPR(avgSaving),
                k: "Average saving",
                c: "var(--saffron)",
              },
              { v: formatNPR(margin), k: "Margin given", c: "var(--danger)" },
            ];
          })().map((s) => (
            <div
              key={s.k}
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div className="tnum" style={{ fontSize: "1.375rem", fontWeight: 600, color: s.c }}>
                {s.v}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>

        {/* Offers */}
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--ink-900)",
          }}
        >
          Offers
        </h2>
        {BARGAIN_OFFERS.length === 0 ? (
          <SellerEmptyState
            icon="bargain"
            title="No offers yet"
            message="When buyers send a price offer on your products, it’ll appear here for you to accept, counter, or decline."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BARGAIN_OFFERS.map((o) => (
              <BargainOfferCard
                key={o.id}
                o={o}
                acceptMutation={acceptMutation}
                rejectMutation={rejectMutation}
                counterMutation={counterMutation}
              />
            ))}
          </div>
        )}
      </div>
    </ApiState>
  );
}
