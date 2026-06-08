"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui";

export interface SellerVideoAnalytics {
  totals: {
    views: number;
    likes: number;
    videos: number;
    published: number;
    drafts: number;
    engagementRate: number;
  };
  viewsByDay: Array<{ label: string; value: number }>;
  topVideos: Array<{ id: string; title: string; views: number; likes: number; status: string }>;
  statusBreakdown: Array<{ label: string; value: number; color: string }>;
}

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--line-200)",
  borderRadius: "var(--r-lg)",
  padding: 18,
};

function MetricBarChart({
  data,
  valuePrefix = "",
}: {
  data: Array<{ label: string; value: number }>;
  valuePrefix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const peakIdx = data.reduce((best, d, i) => (d.value > data[best]!.value ? i : best), 0);
  const chartH = 180;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        {[
          { label: "7-day views", value: total.toLocaleString(), tint: "var(--blue-deep)" },
          { label: "Daily avg", value: avg.toLocaleString(), tint: "var(--ink-700)" },
          {
            label: "Best day",
            value: data[peakIdx]?.value
              ? `${data[peakIdx]!.label} · ${data[peakIdx]!.value.toLocaleString()}`
              : "—",
            tint: "var(--saffron)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: "1 1 120px",
              padding: "10px 12px",
              background: "var(--line-100)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-200)",
            }}
          >
            <div
              style={{
                fontSize: ".65rem",
                fontWeight: 700,
                color: "var(--ink-500)",
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {s.label}
            </div>
            <div
              className="tnum"
              style={{ fontSize: ".9375rem", fontWeight: 800, color: s.tint, marginTop: 4 }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 8,
          height: chartH,
          padding: "8px 4px 0",
          background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--line-100)",
        }}
      >
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const barPct = Math.max(pct, d.value > 0 ? 8 : 4);
          const isPeak = i === peakIdx && d.value > 0;
          return (
            <div
              key={d.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              <div
                className="tnum"
                style={{
                  fontSize: ".65rem",
                  fontWeight: 700,
                  color: d.value > 0 ? "var(--ink-700)" : "var(--ink-400)",
                  marginBottom: 4,
                }}
              >
                {d.value > 0 ? `${valuePrefix}${d.value.toLocaleString()}` : "—"}
              </div>
              <div
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: `${barPct}%`,
                  minHeight: d.value > 0 ? 10 : 4,
                  borderRadius: "8px 8px 3px 3px",
                  background: isPeak
                    ? "linear-gradient(180deg, #fbbf24 0%, #f77f00 100%)"
                    : "linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%)",
                  opacity: d.value > 0 ? 1 : 0.35,
                }}
              />
              <div
                style={{
                  marginTop: 8,
                  fontSize: ".7rem",
                  fontWeight: isPeak ? 800 : 600,
                  color: isPeak ? "var(--red)" : "var(--ink-500)",
                }}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusDonut({
  slices,
}: {
  slices: Array<{ label: string; value: number; color: string }>;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40;
  const c = 50;
  const circ = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg
        width={120}
        height={120}
        viewBox="0 0 100 100"
        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      >
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-100)" strokeWidth="14" />
        {slices.map((s, i) => {
          const len = (s.value / total) * circ;
          const off = circ - acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={off}
            />
          );
        })}
      </svg>
      <div style={{ flex: 1, minWidth: 120 }}>
        {slices.map((s) => (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: ".8125rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: s.color,
                  flexShrink: 0,
                }}
              />
              {s.label}
            </span>
            <span className="tnum" style={{ fontWeight: 800 }}>
              {s.value}
            </span>
          </div>
        ))}
        <div style={{ fontSize: ".7rem", color: "var(--ink-400)", marginTop: 4 }}>
          {total} total video{total === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color = "var(--blue)" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * 100},${30 - ((v - min) / range) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: "100%", height: 32 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity={0.12} />
    </svg>
  );
}

export function SellerVideoAnalyticsPanel({ analytics }: { analytics: SellerVideoAnalytics }) {
  const { totals, viewsByDay, statusBreakdown } = analytics;
  const sparkData = viewsByDay.map((d) => d.value);

  const kpis = [
    {
      label: "Total views",
      value: totals.views.toLocaleString(),
      sub: "All videos",
      icon: "eye" as const,
      color: "var(--blue)",
      bg: "var(--tint-blue-50)",
    },
    {
      label: "Total likes",
      value: totals.likes.toLocaleString(),
      sub: "Buyer engagement",
      icon: "heart" as const,
      color: "var(--red)",
      bg: "rgba(230,57,70,.08)",
    },
    {
      label: "Live videos",
      value: String(totals.published),
      sub: `${totals.drafts} draft`,
      icon: "video" as const,
      color: "var(--success)",
      bg: "rgba(22,163,74,.08)",
    },
    {
      label: "Engagement",
      value: `${totals.engagementRate}%`,
      sub: "Likes ÷ views",
      icon: "trendingUp" as const,
      color: "var(--saffron)",
      bg: "rgba(247,127,0,.08)",
    },
  ];

  return (
    <section style={{ marginBottom: 24 }}>
      <h2
        style={{
          margin: "0 0 14px",
          fontSize: "1rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Video analytics
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
        className="bz-seller-video-kpi-row"
      >
        {kpis.map((k) => (
          <div key={k.label} style={{ ...cardStyle, padding: 14 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <div>
                <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--ink-500)" }}>
                  {k.label}
                </div>
                <div
                  className="tnum"
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                    marginTop: 4,
                  }}
                >
                  {k.value}
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--ink-400)", marginTop: 2 }}>
                  {k.sub}
                </div>
              </div>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-md)",
                  background: k.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={k.icon} size={18} color={k.color} />
              </span>
            </div>
            {k.label === "Total views" && sparkData.some((n) => n > 0) && (
              <div style={{ marginTop: 10 }}>
                <Sparkline data={sparkData} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="bz-seller-video-charts-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 14,
          alignItems: "stretch",
        }}
      >
        <div style={{ ...cardStyle, minHeight: 280 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: ".9375rem",
              marginBottom: 12,
              color: "var(--blue-deep)",
            }}
          >
            Views — last 7 days
          </div>
          <MetricBarChart data={viewsByDay} />
        </div>
        <div
          style={{
            ...cardStyle,
            minHeight: 280,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: ".9375rem",
              marginBottom: 12,
              color: "var(--blue-deep)",
            }}
          >
            Library status
          </div>
          <StatusDonut slices={statusBreakdown} />
        </div>
      </div>
    </section>
  );
}
