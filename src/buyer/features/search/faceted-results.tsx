"use client";

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Icon, PageBar, AppLink, SkeletonCard } from "@/components/ui";
import { ProductCard } from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import { Button } from "@/components/ui";
import type { Product } from "@/types";

/** The faceted-results page shell: breadcrumb, heading, left filter rail + results
 *  grid on desktop, and a bottom-sheet drawer of the same filters on mobile.
 *  Shared by /search (Algolia-backed) and the all-products newest listing on
 *  /browse (catalog-backed) so both wear the exact same UI. The caller owns the
 *  filter facets, the sort control, and the data; this shell owns the layout. */
export interface FacetedResultsLayoutProps {
  breadcrumbLabel: string;
  heading: string;
  /** Facet block — the same node is rendered in the desktop rail and the mobile sheet. */
  filters: React.ReactNode;
  /** Sort label + control (each page brings its own options). */
  sortControl: React.ReactNode;
  /** Count of applied filters — drives the mobile badge and is shown when > 0. */
  activeCount: number;
  items: Product[];
  total: number;
  isLoading: boolean;
  onOpenProduct: (p: Product) => void;
  page: number;
  pageCount: number;
  onPage: (n: number) => void;
}

export function FacetedResultsLayout({
  breadcrumbLabel,
  heading,
  filters,
  sortControl,
  activeCount,
  items,
  total,
  isLoading,
  onOpenProduct,
  page,
  pageCount,
  onPage,
}: FacetedResultsLayoutProps) {
  const { t } = useTranslation();
  const [sheet, setSheet] = React.useState(false);

  // Lock background scroll while the mobile filter sheet is open.
  useEffect(() => {
    if (!sheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [sheet]);

  const showingSkeleton = isLoading && items.length === 0;

  return (
    <div
      className="bz-container-pad"
      style={{
        maxWidth: "var(--container)",
        margin: "0 auto",
        padding: "16px clamp(12px, 4vw, 28px) 48px",
      }}
    >
      {/* Breadcrumb — desktop only (mobile leads with products). */}
      <div
        className="bz-hide-mobile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: ".8125rem",
          color: "var(--ink-400)",
          marginBottom: 12,
        }}
      >
        <AppLink href={pathFromScreen("home")} className="bz-crumb">
          {t("common.home")}
        </AppLink>
        <Icon name="chevronRight" size={13} color="var(--ink-300)" />
        <span style={{ color: "var(--ink-700)" }}>{breadcrumbLabel}</span>
      </div>

      {/* Mobile: heading spans full width above filters + results. */}
      <div
        className="bz-show-mobile bz-show-mobile--flex"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.25rem, 5vw, 1.5rem)",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          {heading}
        </h1>
        <button
          type="button"
          aria-label={t("search.filtersAria")}
          className="bz-show-mobile bz-show-mobile--flex bz-hover-border"
          onClick={() => setSheet(true)}
          style={{
            position: "relative",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            width: 42,
            height: 42,
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--line-200)",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <Icon name="sliders" size={20} color="var(--ink-700)" />
          {activeCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                background: "var(--red)",
                color: "#fff",
                borderRadius: "var(--r-full)",
                fontSize: ".6875rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* ---- Desktop left filter rail (hidden on mobile) ---- */}
        <aside className="bz-hide-mobile" style={{ flex: "0 0 248px", fontSize: ".875rem" }}>
          {filters}
        </aside>

        {/* ---- Main results ---- */}
        <main style={{ flex: "1 1 420px", minWidth: 0 }}>
          <h1
            className="bz-hide-mobile"
            style={{
              margin: "0 0 4px",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--blue-deep)",
              letterSpacing: "-.01em",
            }}
          >
            {heading}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              className="tnum"
              style={{ color: "var(--ink-500)", fontSize: ".875rem", marginRight: "auto" }}
            >
              {showingSkeleton
                ? t("search.searching")
                : t("search.productsFound", { count: total.toLocaleString("en-IN") })}
            </span>
            {sortControl}
          </div>

          {showingSkeleton ? (
            <div className="bz-search-grid" style={gridStyle}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 16px", color: "var(--ink-500)" }}>
              <div
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 800,
                  color: "var(--ink-900)",
                  marginBottom: 6,
                }}
              >
                {t("search.noProductsMatch")}
              </div>
              <div style={{ fontSize: ".875rem" }}>{t("search.tryDifferent")}</div>
            </div>
          ) : (
            <>
              <div className="bz-search-grid" style={gridStyle}>
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} onClick={onOpenProduct} />
                ))}
              </div>
              <PageBar
                page={page}
                pageCount={pageCount}
                alwaysShow={false}
                onPage={(n: number) => {
                  onPage(n);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </main>
      </div>

      {/* ---- Mobile filter sheet (bottom drawer) ---- */}
      {sheet && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(11,18,32,.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setSheet(false)}
        >
          <div
            className="fade-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "var(--r-xl) var(--r-xl) 0 0",
              width: "100%",
              maxWidth: 560,
              padding: "16px 20px 0",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "var(--line-200)",
                borderRadius: 2,
                margin: "0 auto 14px",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.125rem" }}>{t("search.filters")}</h3>
              <button
                onClick={() => setSheet(false)}
                aria-label={t("search.closeFilters")}
                className="bz-hover-tint"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-full)",
                  border: "1.5px solid var(--line-200)",
                  background: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} color="var(--ink-700)" />
              </button>
            </div>

            <div style={{ overflowY: "auto", paddingBottom: 12, fontSize: ".9375rem" }}>
              {filters}
            </div>

            <div
              style={{
                flexShrink: 0,
                padding: "12px 0 16px",
                borderTop: "1px solid var(--line-100)",
              }}
            >
              <Button variant="primary" full onClick={() => setSheet(false)}>
                {total === 1
                  ? t("search.showResult", { count: total.toLocaleString("en-IN") })
                  : t("search.showResults", { count: total.toLocaleString("en-IN") })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const priceInput: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid var(--line-200)",
  borderRadius: "var(--r-sm)",
  fontSize: ".8125rem",
};

export interface FacetRowData {
  value: string;
  label: string;
  count: number;
}

export interface ProductFacetsProps {
  categoryRows: FacetRowData[];
  selectedCats: string[];
  onToggleCat: (value: string) => void;
  sellerRows: FacetRowData[];
  selectedSellers: string[];
  onToggleSeller: (value: string) => void;
  sellerSearch: string;
  onSellerSearch: (value: string) => void;
  pmin: string;
  pmax: string;
  onPmin: (value: string) => void;
  onPmax: (value: string) => void;
  rating: number;
  onRating: (n: number) => void;
  hasFilters: boolean;
  onClearAll: () => void;
}

/** The Categories / Sellers / Price / Rating filter block, identical on /search
 *  (Algolia facets) and the newest listing on /browse (catalog facets). The
 *  caller supplies the facet rows + state; this owns the labels and markup so
 *  both surfaces stay byte-for-byte consistent. */
export function ProductFacets({
  categoryRows,
  selectedCats,
  onToggleCat,
  sellerRows,
  selectedSellers,
  onToggleSeller,
  sellerSearch,
  onSellerSearch,
  pmin,
  pmax,
  onPmin,
  onPmax,
  rating,
  onRating,
  hasFilters,
  onClearAll,
}: ProductFacetsProps) {
  const { t } = useTranslation();
  return (
    <>
      <FacetGroup title={t("search.categories")}>
        {categoryRows.length === 0 ? (
          <EmptyHint>{t("search.noCategories")}</EmptyHint>
        ) : (
          categoryRows.map((c) => (
            <FacetRow
              key={c.value}
              label={c.label}
              count={c.count}
              checked={selectedCats.includes(c.value)}
              onToggle={() => onToggleCat(c.value)}
            />
          ))
        )}
      </FacetGroup>

      <FacetGroup title={t("search.sellers")}>
        <input
          value={sellerSearch}
          onChange={(e) => onSellerSearch(e.target.value)}
          placeholder={t("search.searchSellers")}
          style={{ ...priceInput, marginBottom: 8 }}
        />
        {sellerRows.length === 0 ? (
          <EmptyHint>{t("search.noSellers")}</EmptyHint>
        ) : (
          sellerRows.map((s) => (
            <FacetRow
              key={s.value}
              label={s.label}
              count={s.count}
              checked={selectedSellers.includes(s.value)}
              onToggle={() => onToggleSeller(s.value)}
            />
          ))
        )}
      </FacetGroup>

      <FacetGroup title={t("search.price")}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            value={pmin}
            onChange={(e) => onPmin(e.target.value)}
            placeholder={t("search.priceMin")}
            style={priceInput}
          />
          <span style={{ color: "var(--ink-400)" }}>–</span>
          <input
            type="number"
            value={pmax}
            onChange={(e) => onPmax(e.target.value)}
            placeholder={t("search.priceMax")}
            style={priceInput}
          />
        </div>
      </FacetGroup>

      <FacetGroup title={t("search.rating")}>
        <RatingFacet rating={rating} onRating={onRating} upLabel={t("search.ratingUp")} />
      </FacetGroup>

      {hasFilters ? (
        <Button variant="secondary" size="sm" full onClick={onClearAll} style={{ marginTop: 8 }}>
          {t("search.clearAllFilters")}
        </Button>
      ) : null}
    </>
  );
}

export const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(172px, 1fr))",
  gap: 14,
};

export function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: ".75rem",
          fontWeight: 700,
          color: "var(--ink-400)",
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function FacetRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "3px 0",
        cursor: "pointer",
        color: checked ? "var(--blue)" : "var(--ink-700)",
        fontWeight: checked ? 700 : 500,
        fontSize: ".8125rem",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ accentColor: "var(--blue)" }}
      />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span
        style={{
          marginLeft: "auto",
          background: "var(--line-100)",
          color: "var(--ink-400)",
          borderRadius: "var(--r-full)",
          padding: "0 8px",
          fontSize: ".7rem",
          fontWeight: 700,
        }}
      >
        {count}
      </span>
    </label>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "var(--ink-300)", fontSize: ".8125rem", padding: "2px 0" }}>
      {children}
    </div>
  );
}

/** Rating facet — shared "N★ & up" toggle list. */
export function RatingFacet({
  rating,
  onRating,
  upLabel,
}: {
  rating: number;
  onRating: (n: number) => void;
  upLabel: string;
}) {
  return (
    <>
      {[4, 3, 2, 1].map((n) => (
        <button
          key={n}
          onClick={() => onRating(rating === n ? 0 : n)}
          aria-pressed={rating === n}
          className="bz-hover-tint"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            width: "100%",
            padding: "4px 6px",
            border: "none",
            borderRadius: "var(--r-sm)",
            background: "none",
            cursor: "pointer",
            color: rating === n ? "var(--blue)" : "var(--ink-700)",
            fontWeight: rating === n ? 700 : 500,
            fontSize: ".8125rem",
          }}
        >
          <span style={{ color: "var(--gold)" }}>
            {"★".repeat(n)}
            {"☆".repeat(5 - n)}
          </span>
          {upLabel}
        </button>
      ))}
    </>
  );
}

/** Sort label + native select — shared chrome; each page passes its own options. */
export function SortSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
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
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bz-hover-border"
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
