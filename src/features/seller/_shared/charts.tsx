"use client";

import React from "react";
import { formatNPR } from "@/lib/money";

/* ---------- 4.2 Seller Dashboard ---------- */

/* Inline SVG charts (no deps) */

export function SellerBarChart({
  data,
  height = 280,
  summaryTotalLabel = "7-day total",
}: {
  data: { label: string; value: number }[];
  height?: number;
  summaryTotalLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const peakIdx = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? 0) ? i : best), 0);
  const chartH = Math.max(height - 72, 160);
  // With many buckets (24 hourly / 30 daily) the per-bar amount labels overlap,
  // so only show them for the sparser week view.
  const showBarValues = data.length <= 10;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: summaryTotalLabel,
            value: formatNPR(total),
            tint: "var(--blue-deep)",
          },
          {
            label: "Daily average",
            value: formatNPR(avg),
            tint: "var(--ink-700)",
          },
          {
            label: "Best day",
            value: data[peakIdx]?.value
              ? `${data[peakIdx].label} · ${formatNPR(data[peakIdx].value)}`
              : "—",
            tint: "var(--saffron)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: "1 1 140px",
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
              style={{ fontSize: "1rem", fontWeight: 600, color: s.tint, marginTop: 4 }}
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
          gap: 10,
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
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              {showBarValues && (
                <div
                  className="tnum"
                  style={{
                    fontSize: ".68rem",
                    fontWeight: 600,
                    color: d.value > 0 ? "var(--ink-700)" : "var(--ink-400)",
                    marginBottom: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.value > 0 ? formatNPR(d.value) : "—"}
                </div>
              )}
              <div
                title={`${d.label}: ${formatNPR(d.value)}`}
                style={{
                  width: "100%",
                  maxWidth: 64,
                  height: `${barPct}%`,
                  minHeight: d.value > 0 ? 12 : 6,
                  borderRadius: "10px 10px 4px 4px",
                  background: isPeak
                    ? "linear-gradient(180deg, #fbbf24 0%, #f77f00 45%, #e63946 100%)"
                    : d.value > 0
                      ? "linear-gradient(180deg, color-mix(in srgb, var(--blue) 55%, #fff) 0%, var(--blue) 100%)"
                      : "var(--line-200)",
                  boxShadow: isPeak
                    ? "0 4px 14px rgba(230,57,70,.25)"
                    : "0 2px 8px color-mix(in srgb, var(--blue) 16%, transparent)",
                  transition: "height .2s ease",
                }}
              />
              <div
                style={{
                  marginTop: 10,
                  fontSize: ".75rem",
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

export function SellerSparkline({
  data,
  color = "var(--blue)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1),
    min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / range) * 26}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity=".12" />
    </svg>
  );
}

export function SellerDonut({
  slices,
  size = 160,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40,
    c = 50,
    circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg
        width={size}
        height={size}
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
      <div style={{ flex: 1 }}>
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: i < slices.length - 1 ? "1px dashed var(--line-200)" : "none",
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: ".875rem" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span style={{ fontWeight: 600 }}>{s.label}</span>
            </span>
            <span className="tnum" style={{ fontWeight: 600, fontSize: ".875rem" }}>
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
