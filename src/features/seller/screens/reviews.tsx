"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, RatingStars, ChipGroup, ApiState } from "@/components/ui";
import { useSellerReviews } from "@/hooks/use-seller";
import { useBz, BuyerAvatar } from "@/components/common";
import { SellerHelpBar, SellerPageHeader, SellerEmptyState } from "../_shared/components";


/* ---------- 4.10 Reviews ---------- */
export function SellerReviews() {
  const { t } = useTranslation();
  const { toast } = useBz();
  const { data: REVIEWS_DATA = [], isLoading, isError, error } = useSellerReviews();
  const [filter, setFilter] = useState("all");
  const list = REVIEWS_DATA.filter(
    (r) =>
      filter === "all" ||
      (filter === "unreplied" && !r.replied) ||
      (filter === "low" && r.stars <= 3),
  );
  const avg = REVIEWS_DATA.length
    ? (REVIEWS_DATA.reduce((s, r) => s + r.stars, 0) / REVIEWS_DATA.length).toFixed(1)
    : "0.0";

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <SellerHelpBar />
        <SellerPageHeader
          title={t("seller.reviews.title")}
          subtitle={t("seller.reviews.subtitle")}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            { v: `${avg} ★`, k: "Average", c: "var(--gold)" },
            { v: REVIEWS_DATA.length, k: "Total", c: "var(--blue)" },
            { v: REVIEWS_DATA.filter((r) => !r.replied).length, k: "Needs reply", c: "var(--red)" },
            {
              v: REVIEWS_DATA.filter((r) => r.stars <= 3).length,
              k: "Low ratings",
              c: "var(--danger)",
            },
          ].map((s) => (
            <div
              key={s.k}
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div className="tnum" style={{ fontSize: "1.375rem", fontWeight: 800, color: s.c }}>
                {s.v}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{s.k}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <ChipGroup
            options={[
              { value: "all", label: "All" },
              { value: "unreplied", label: "Needs reply" },
              { value: "low", label: "Low (≤ 3★)" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.length === 0 && (
            <SellerEmptyState
              icon="star"
              title="No reviews yet"
              message="When buyers review your products, their feedback will appear here."
            />
          )}
          {list.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                border: `1.5px solid ${r.low ? "var(--danger)" : "var(--line-200)"}`,
                borderRadius: "var(--r-lg)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <BuyerAvatar
                  src={r.avatar}
                  name={r.buyer}
                  size={36}
                  fontSize=".875rem"
                  style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{r.buyer}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                    {r.product} · {r.time}
                  </div>
                </div>
                <RatingStars value={r.stars} />
              </div>
              <p style={{ margin: "8px 0", color: "var(--ink-700)", fontSize: ".9375rem" }}>
                {r.text}
              </p>
              {r.replied ? (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    background: "var(--line-100)",
                    borderRadius: "var(--r-md)",
                    borderLeft: "3px solid var(--blue)",
                  }}
                >
                  <div
                    style={{
                      fontSize: ".7rem",
                      color: "var(--blue)",
                      fontWeight: 800,
                      marginBottom: 2,
                    }}
                  >
                    Your reply
                  </div>
                  <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>{r.reply}</div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button variant="primary" size="sm" onClick={() => toast("Reply sent")}>
                    Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="flag"
                    onClick={() => toast("Reported to BazaarCo")}
                  >
                    Report
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ApiState>
  );
}
