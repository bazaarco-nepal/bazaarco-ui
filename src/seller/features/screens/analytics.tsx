"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Placeholder, ApiState } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { formatNPR } from "@/shared/lib/money";
import { useSellerAnalytics } from "@/seller/hooks/use-seller";
import { SellerBarChart } from "../_shared/charts";
import { SellerHelpBar, SellerPageHeader } from "../_shared/components";

/* ---------- NEW: Simple Analytics ("My shop") for non-tech 40+ users ---------- */

export function SellerAnalytics() {
  const { t } = useTranslation();
  const { data: analytics, isLoading, isError, error } = useSellerAnalytics();
  const salesByDay = analytics?.salesByDay ?? [];
  const topProducts = analytics?.topProducts ?? [];
  const moneyBuckets = analytics?.moneyBuckets ?? [];
  const followers = analytics?.followers;
  const followerTrend = followers?.trend7d ?? [];
  const maxBucket = Math.max(...moneyBuckets.map((b: { v: number }) => b.v), 0) || 1;
  const maxFollowerTrend = Math.max(...followerTrend.map((d) => d.value), 0) || 1;
  const soldToday = moneyBuckets.find((b: { en: string }) => b.en === "Sold today")?.v ?? 0;
  const withCourier = moneyBuckets.find((b: { en: string }) => b.en === "With courier")?.v ?? 0;
  const bestDay = salesByDay.reduce(
    (best: { label: string; value: number }, d: { label: string; value: number }) =>
      d.value > best.value ? d : best,
    { label: "—", value: 0 },
  );

  const cardStyle = {
    background: "#fff",
    border: "1px solid var(--line-200)",
    borderRadius: "var(--r-lg)",
    padding: 22,
    boxShadow: "var(--sh-1)",
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page">
        <SellerHelpBar />

        <div className="bz-seller-analytics-span-12">
          <SellerPageHeader
            title={t("seller.analytics.title")}
            subtitle={t("seller.analytics.subtitle")}
          />
        </div>

        <div className="bz-seller-analytics-layout">
          <div className="bz-seller-analytics-span-12" style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--ink-900)",
                  }}
                >
                  Store followers
                </h2>
                <p style={{ margin: "3px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
                  Buyers who chose to keep your store close.
                </p>
              </div>
              <span
                className="tnum"
                style={{
                  color: "var(--blue)",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {(followers?.total ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bz-store-followers-grid">
              {[
                { label: "New this week", value: followers?.new7d ?? 0, icon: "trendingUp" },
                { label: "New this month", value: followers?.new30d ?? 0, icon: "clock" },
                {
                  label: "7-day peak",
                  value: followerTrend.reduce((best, d) => Math.max(best, d.value), 0),
                  icon: "star",
                },
              ].map((item) => (
                <div key={item.label} className="bz-store-followers-stat">
                  <span className="bz-icon-tile">
                    <SellerIcon name={item.icon} size={18} color="var(--blue)" />
                  </span>
                  <div>
                    <div className="bz-store-followers-stat__label">{item.label}</div>
                    <div className="bz-store-followers-stat__value tnum">
                      {item.value.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gap: 8,
                alignItems: "end",
                minHeight: 96,
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--line-200)",
              }}
              aria-label="Follower trend for the last 7 days"
            >
              {followerTrend.map((d) => (
                <div key={d.label} style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div
                    title={`${d.value} new followers`}
                    style={{
                      height: `${Math.max(8, (d.value / maxFollowerTrend) * 64)}px`,
                      borderRadius: "var(--r-sm)",
                      background: d.value > 0 ? "var(--blue)" : "var(--line-200)",
                    }}
                  />
                  <div
                    style={{
                      color: "var(--ink-400)",
                      fontSize: ".7rem",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bz-seller-analytics-span-4" style={cardStyle}>
            <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-500)" }}>
              Today you sold
            </div>
            <div
              className="tnum bz-stat-xl"
              style={{
                fontWeight: 600,
                letterSpacing: "-.02em",
                margin: "6px 0 4px",
                color: "var(--ink-900)",
              }}
            >
              {formatNPR(soldToday)}
            </div>
            <div style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
              Courier holding {formatNPR(withCourier)}
            </div>
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--line-200)",
                display: "grid",
                gap: 12,
              }}
            >
              {moneyBuckets.map((b) => (
                <div
                  key={b.en}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: ".8125rem", fontWeight: 500, color: "var(--ink-500)" }}>
                    {b.en}
                  </span>
                  <span className="tnum" style={{ fontWeight: 600, color: "var(--ink-900)" }}>
                    {formatNPR(b.v)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bz-seller-analytics-span-8" style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--ink-900)",
                  }}
                >
                  Shop snapshot
                </h2>
              </div>
              <div
                style={{
                  padding: "8px 14px",
                  background: "var(--line-100)",
                  borderRadius: 999,
                  fontSize: ".75rem",
                  fontWeight: 600,
                  color: "var(--ink-500)",
                }}
              >
                Last 7 days
              </div>
            </div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: ".875rem",
                color: "var(--ink-600)",
                maxWidth: 560,
              }}
            >
              {bestDay.value > 0
                ? `${bestDay.label} was your strongest day — ${formatNPR(bestDay.value)} in sales.`
                : "Sales will show here once you start receiving orders."}
            </p>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
            >
              {[
                {
                  label: "7-day total",
                  value: formatNPR(salesByDay.reduce((s, d) => s + d.value, 0)),
                },
                {
                  label: "Daily average",
                  value: formatNPR(
                    Math.round(
                      salesByDay.reduce((s, d) => s + d.value, 0) / Math.max(salesByDay.length, 1),
                    ),
                  ),
                },
                { label: "Best day", value: bestDay.value > 0 ? bestDay.label : "—" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "12px 14px",
                    background: "var(--line-100)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--line-200)",
                  }}
                >
                  <div
                    style={{
                      fontSize: ".7rem",
                      fontWeight: 600,
                      color: "var(--ink-500)",
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="tnum"
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--ink-900)",
                      marginTop: 4,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bz-seller-analytics-span-8" style={cardStyle}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--ink-900)",
              }}
            >
              Sales — last 7 days
            </h2>
            <SellerBarChart data={salesByDay} height={300} />
          </div>

          <div className="bz-seller-analytics-span-4" style={cardStyle}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "var(--ink-900)",
              }}
            >
              Where my money is
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {moneyBuckets.map((b) => {
                const pct = (b.v / maxBucket) * 100;
                return (
                  <div key={b.en}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: ".95rem" }}>{b.en}</span>
                      </div>
                      <span
                        className="tnum"
                        style={{ fontWeight: 600, fontSize: "1.05rem", color: b.c }}
                      >
                        {formatNPR(b.v)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 14,
                        background: "var(--line-100)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: b.c,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                marginTop: 14,
                padding: 10,
                background: "var(--tint-blue-50)",
                borderRadius: "var(--r-md)",
                fontSize: ".875rem",
                color: "var(--ink-900)",
              }}
            >
              <SellerIcon
                name="badgeCheck"
                size={14}
                color="var(--blue)"
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              {withCourier > 0
                ? `${formatNPR(withCourier)} is with courier until delivery is confirmed.`
                : "No payouts in transit right now."}
            </p>
          </div>

          <div className="bz-seller-analytics-span-12" style={cardStyle}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--ink-900)",
              }}
            >
              Your top 3 items this week
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topProducts.length === 0 && (
                <p style={{ margin: 0, color: "var(--ink-500)", fontSize: ".875rem" }}>
                  No sales yet this week.
                </p>
              )}
              {topProducts.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 12,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--gold)" : "var(--line-200)",
                      color: i === 0 ? "#fff" : "var(--ink-700)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <Placeholder
                    icon={p.icon}
                    style={{ width: 56, height: 56, flexShrink: 0 }}
                    radius="var(--r-sm)"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: ".95rem" }}>{p.name}</div>
                    <div
                      className="tnum"
                      style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}
                    >
                      {p.units} sold
                    </div>
                  </div>
                  <div
                    className="tnum"
                    style={{ fontWeight: 600, color: "var(--success)", fontSize: "1rem" }}
                  >
                    {formatNPR(Number(p.rev))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ApiState>
  );
}
