"use client";

import React, { useMemo, useState } from "react";
import {
  Icon,
  RatingStars,
  EmptyState,
  ApiState,
  SkeletonCard,
  AppLink,
  StoreAvatar,
} from "@/components/ui";
import { useBz } from "@/components/common";
import { useSellers } from "@/hooks/use-catalog";
import { pathFromScreen } from "@/config/routes";
import type { Seller } from "@/types";

type SortKey = "top" | "az";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "top", label: "Top rated" },
  { value: "az", label: "Name A–Z" },
];

/** Buyer-facing store directory: every seller, searchable by shop name or city,
 *  sortable, laid out as a dense brand grid (2-up on mobile, 4-up on desktop). */
export function Stores() {
  const { openStore } = useBz();
  const sellersQuery = useSellers();
  const sellers = useMemo(() => sellersQuery.data ?? [], [sellersQuery.data]);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("top");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? sellers.filter(
          (s) =>
            s.name.toLowerCase().includes(needle) || (s.city ?? "").toLowerCase().includes(needle),
        )
      : sellers;
    const sorted = [...list];
    if (sort === "az") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Top rated: best rating first, ties broken by review volume.
      sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    }
    return sorted;
  }, [sellers, q, sort]);

  return (
    <ApiState
      isLoading={sellersQuery.isLoading}
      isError={sellersQuery.isError}
      error={sellersQuery.error}
      fallback={
        <div
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "20px clamp(12px, 4vw, 28px)",
          }}
        >
          <div className="bz-stores-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      }
    >
      <div className="bz-stores-page" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        {/* breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".8125rem",
            color: "var(--ink-400)",
            marginBottom: 14,
          }}
        >
          <AppLink href={pathFromScreen("home")} className="bz-crumb">
            Home
          </AppLink>
          <Icon name="chevronRight" size={13} color="var(--ink-300)" />
          <span style={{ color: "var(--ink-700)" }}>All Stores</span>
        </div>

        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
            letterSpacing: "-.01em",
          }}
        >
          All Stores
        </h1>
        <p style={{ margin: "0 0 18px", color: "var(--ink-500)", fontSize: ".9375rem" }}>
          Discover every seller on BazaarCo.
        </p>

        {/* search */}
        <div style={{ position: "relative", maxWidth: 460, marginBottom: 16 }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={18} color="var(--ink-400)" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stores by name or city"
            aria-label="Search stores"
            style={{
              width: "100%",
              padding: "11px 38px 11px 42px",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              fontSize: ".9375rem",
              background: "#fff",
              color: "var(--ink-900)",
            }}
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 28,
                height: 28,
                borderRadius: "var(--r-full)",
                border: "none",
                background: "var(--line-100)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="x" size={15} color="var(--ink-500)" />
            </button>
          )}
        </div>

        {/* count + sort */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span className="tnum" style={{ color: "var(--ink-500)", fontSize: ".875rem" }}>
            {filtered.length === 1
              ? "1 store"
              : `${filtered.length.toLocaleString("en-IN")} stores`}
          </span>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: ".75rem",
                fontWeight: 700,
                color: "var(--ink-400)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort stores"
              style={{
                padding: "8px 12px",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                fontWeight: 600,
                background: "#fff",
                color: "var(--ink-700)",
                cursor: "pointer",
              }}
            >
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={q ? "No stores match your search" : "No stores yet"}
            message={q ? "Try a different name or city." : "Check back soon for new sellers."}
          />
        ) : (
          <div className="bz-stores-grid" style={{ paddingBottom: 8 }}>
            {filtered.map((seller) => (
              <StoreCard key={seller.id} seller={seller} onOpen={() => openStore(seller.id)} />
            ))}
          </div>
        )}
      </div>
    </ApiState>
  );
}

function StoreCard({ seller, onOpen }: { seller: Seller; onOpen: () => void }) {
  const hasReviews = seller.reviews > 0;
  return (
    <AppLink
      href={pathFromScreen("store", seller.id)}
      onNavigate={onOpen}
      className="bz-store-card"
    >
      <div className="bz-store-card__head">
        <StoreAvatar src={seller.avatar} name={seller.name} size={48} />
        <div className="bz-store-card__id">
          <div className="bz-store-card__name">{seller.name}</div>
          {seller.city ? (
            <div className="bz-store-card__loc">
              <Icon name="mapPin" size={12} color="var(--ink-400)" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{seller.city}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Only show the star row once a store has at least one review — empty
          stars on 0 reviews made the whole directory read as inactive. */}
      {hasReviews ? (
        <div className="bz-store-card__rating">
          <RatingStars value={seller.rating} size={14} showVal count={seller.reviews} />
        </div>
      ) : (
        <div className="bz-store-card__noreviews">No reviews yet</div>
      )}

      <span className="bz-store-card__cta">
        Visit store <Icon name="arrowRight" size={14} />
      </span>
    </AppLink>
  );
}
