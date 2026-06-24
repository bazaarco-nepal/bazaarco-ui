"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { Button, RatingStars, ChipGroup, ApiState } from "@/components/ui";
import { useSellerReviews, useSellerProductReviews } from "@/seller/hooks/use-seller";
import { BuyerAvatar, useBz } from "@/components/common";
import { toast } from "@/shared/lib/toast";
import type { SellerProductReview } from "@/seller/api/seller";
import {
  SellerHelpBar,
  SellerPageHeader,
  SellerEmptyState,
  SellerPage,
  MetricGrid,
  Metric,
} from "../_shared/components";

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------- Store-level reviews (anyone can leave one) ---------- */
function StoreReviewsTab() {
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
      <div style={{ marginBottom: 18 }}>
        <MetricGrid>
          {[
            { v: `${avg} ★`, k: "Average" },
            { v: REVIEWS_DATA.length, k: "Total" },
            { v: REVIEWS_DATA.filter((r) => !r.replied).length, k: "Needs reply" },
            { v: REVIEWS_DATA.filter((r) => r.stars <= 3).length, k: "Low ratings" },
          ].map((s) => (
            <Metric key={s.k} label={s.k} value={s.v} />
          ))}
        </MetricGrid>
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
            title="No store reviews yet"
            message="When buyers review your store, their feedback will appear here."
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
                <div style={{ fontWeight: 600 }}>{r.buyer}</div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  {formatReviewDate(r.time)}
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
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  Your reply
                </div>
                <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>{r.reply}</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Button variant="primary" size="sm" onClick={() => toast.success("Reply sent")}>
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="flag"
                  onClick={() => toast.success("Reported to BazaarCo")}
                >
                  Report
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ApiState>
  );
}

/* ---------- Product-level reviews, grouped per product ---------- */
function groupByProduct(items: SellerProductReview[]) {
  const groups = new Map<
    string,
    { product: SellerProductReview["product"]; rows: SellerProductReview[] }
  >();
  for (const r of items) {
    const g = groups.get(r.product.id);
    if (g) g.rows.push(r);
    else groups.set(r.product.id, { product: r.product, rows: [r] });
  }
  return [...groups.values()];
}

function ProductReviewCard({ r }: { r: SellerProductReview }) {
  return (
    <div style={{ padding: "14px 0", borderTop: "1px solid var(--line-100)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <BuyerAvatar
          src={r.avatar}
          name={r.name}
          size={32}
          fontSize=".8125rem"
          style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
            {r.city} · {formatReviewDate(r.date)}
          </div>
        </div>
        <RatingStars value={r.rating} />
      </div>
      <p style={{ margin: "6px 0 0", color: "var(--ink-700)", fontSize: ".9375rem" }}>{r.text}</p>
      {r.photoUrls.length > 0 && (
        <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
          {r.photoUrls.length} photo{r.photoUrls.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function ProductReviewsTab({ productFilter }: { productFilter: string | null }) {
  const { nav } = useBz();
  const query = useSellerProductReviews({ product: productFilter });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const groups = useMemo(() => groupByProduct(items), [items]);
  const productName = productFilter ? items[0]?.product.name : null;

  return (
    <ApiState isLoading={query.isLoading} isError={query.isError} error={query.error}>
      {productFilter && productName && (
        <div
          style={{
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>
            Showing reviews for <b>{productName}</b>
          </div>
          <Button variant="ghost" size="sm" onClick={() => nav("s-reviews")}>
            View all products
          </Button>
        </div>
      )}

      {groups.length === 0 ? (
        <SellerEmptyState
          icon="star"
          title="No product reviews yet"
          message="Reviews buyers leave on your products — after delivery — will appear here, grouped by product."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((g) => (
            <div
              key={g.product.id}
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                    background: "var(--line-100)",
                    flexShrink: 0,
                  }}
                >
                  {g.product.image && (
                    <img
                      src={g.product.image}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--ink-900)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.product.name}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
                    {g.rows.length} review{g.rows.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              {g.rows.map((r) => (
                <ProductReviewCard key={r.id} r={r} />
              ))}
            </div>
          ))}

          {query.hasNextPage && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "Loading…" : "Show more reviews"}
              </Button>
            </div>
          )}
        </div>
      )}
    </ApiState>
  );
}

export function SellerReviews() {
  const { t } = useTranslation();
  const productFilter = useSearchParams().get("product");
  // A product deep link lands on the Products tab; otherwise product reviews lead.
  const [tab, setTab] = useState<"products" | "store">("products");

  return (
    <SellerPage>
      <SellerHelpBar />
      <SellerPageHeader title={t("seller.reviews.title")} subtitle={t("seller.reviews.subtitle")} />

      <div style={{ marginBottom: 16 }}>
        <ChipGroup
          options={[
            { value: "products", label: "Products" },
            { value: "store", label: "Store" },
          ]}
          value={tab}
          onChange={(v: string) => setTab(v as "products" | "store")}
        />
      </div>

      {tab === "products" ? (
        <ProductReviewsTab productFilter={productFilter} />
      ) : (
        <StoreReviewsTab />
      )}
    </SellerPage>
  );
}
