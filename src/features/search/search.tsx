"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, PageBar, AppLink, SkeletonCard, Button } from "@/components/ui";
import { ProductCard, useBz } from "@/components/common";
import { useCatalog } from "@/hooks/use-catalog";
import { useSearch } from "@/hooks/use-search";
import { pathFromScreen } from "@/config/routes";
import type { SearchParams } from "@/services/api/search";

const PER_PAGE = 24;

const SORT_OPTIONS: { value: NonNullable<SearchParams["sort"]>; label: string }[] = [
  { value: "relevance", label: "Relevancy" },
  { value: "rating", label: "Top rated" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
];

/** Faceted search results — left filter rail + results grid, Typesense-backed.
 *  Mobile lays the same filters out in a bottom sheet so products come first. */
export function Search() {
  const { openProduct } = useBz();
  const { categories: CATEGORIES } = useCatalog();
  const urlParams = useSearchParams();
  const urlQuery = urlParams.get("q")?.trim() ?? "";

  const [cats, setCats] = useState<string[]>([]);
  const [sellers, setSellers] = useState<string[]>([]);
  const [sellerSearch, setSellerSearch] = useState("");
  const [pmin, setPmin] = useState("");
  const [pmax, setPmax] = useState("");
  const [appliedMin, setAppliedMin] = useState("");
  const [appliedMax, setAppliedMax] = useState("");
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState<NonNullable<SearchParams["sort"]>>("relevance");
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState(false); // mobile filter drawer

  // Debounce the price inputs so typing a number doesn't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedMin(pmin);
      setAppliedMax(pmax);
    }, 400);
    return () => clearTimeout(t);
  }, [pmin, pmax]);

  const params: SearchParams = {
    query: urlQuery,
    categories: cats.length ? cats : undefined,
    sellers: sellers.length ? sellers : undefined,
    price_min: appliedMin !== "" ? Math.max(0, parseInt(appliedMin, 10) || 0) : undefined,
    price_max: appliedMax !== "" ? Math.max(0, parseInt(appliedMax, 10) || 0) : undefined,
    rating: rating || undefined,
    sort,
    page,
    limit: PER_PAGE,
  };

  // Reset to page 1 whenever the query or any filter changes.
  const filterKey = `${urlQuery}|${cats.join(",")}|${sellers.join(",")}|${appliedMin}|${appliedMax}|${rating}|${sort}`;
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  // Lock background scroll while the mobile filter sheet is open.
  useEffect(() => {
    if (!sheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [sheet]);

  const { data, isFetching } = useSearch(params);

  const total = data?.total ?? 0;
  const timeMs = data?.search_time_ms ?? 0;
  const items = data?.items ?? [];
  const catFacets = data?.facets?.categories ?? [];
  const sellerFacets = useMemo(() => {
    const all = data?.facets?.sellers ?? [];
    const filtered = sellerSearch
      ? all.filter((s) => s.value.toLowerCase().includes(sellerSearch.toLowerCase()))
      : all;
    return filtered.slice(0, 12);
  }, [data, sellerSearch]);

  const catName = (id: string) => (CATEGORIES ?? []).find((c) => c.id === id)?.en ?? id;

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const clearAll = () => {
    setCats([]);
    setSellers([]);
    setSellerSearch("");
    setPmin("");
    setPmax("");
    setRating(0);
  };
  const activeCount =
    cats.length + sellers.length + (rating ? 1 : 0) + (pmin !== "" || pmax !== "" ? 1 : 0);
  const hasFilters = activeCount > 0;

  const heading = urlQuery ? `Results for "${urlQuery}"` : "All products";

  // One filter block, rendered in both the desktop rail and the mobile sheet.
  const filters = (
    <>
      <FacetGroup title="Categories">
        {catFacets.length === 0 ? (
          <EmptyHint>No categories</EmptyHint>
        ) : (
          catFacets.map((c) => (
            <FacetRow
              key={c.value}
              label={catName(c.value)}
              count={c.count}
              checked={cats.includes(c.value)}
              onToggle={() => toggle(cats, setCats, c.value)}
            />
          ))
        )}
      </FacetGroup>

      <FacetGroup title="Sellers">
        <input
          value={sellerSearch}
          onChange={(e) => setSellerSearch(e.target.value)}
          placeholder="Search sellers"
          style={{
            width: "100%",
            padding: "7px 10px",
            marginBottom: 8,
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-sm)",
            fontSize: ".8125rem",
          }}
        />
        {sellerFacets.length === 0 ? (
          <EmptyHint>No sellers</EmptyHint>
        ) : (
          sellerFacets.map((s) => (
            <FacetRow
              key={s.value}
              label={s.value}
              count={s.count}
              checked={sellers.includes(s.value)}
              onToggle={() => toggle(sellers, setSellers, s.value)}
            />
          ))
        )}
      </FacetGroup>

      <FacetGroup title="Price (Rs.)">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            value={pmin}
            onChange={(e) => setPmin(e.target.value)}
            placeholder="min"
            style={priceInput}
          />
          <span style={{ color: "var(--ink-400)" }}>–</span>
          <input
            type="number"
            value={pmax}
            onChange={(e) => setPmax(e.target.value)}
            placeholder="max"
            style={priceInput}
          />
        </div>
      </FacetGroup>

      <FacetGroup title="Rating">
        {[4, 3, 2, 1].map((n) => (
          <button
            key={n}
            onClick={() => setRating(rating === n ? 0 : n)}
            aria-pressed={rating === n}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "4px 0",
              border: "none",
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
            & up
          </button>
        ))}
      </FacetGroup>

      {hasFilters ? (
        <button
          onClick={clearAll}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "9px 14px",
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--line-200)",
            background: "#fff",
            color: "var(--ink-700)",
            fontWeight: 700,
            fontSize: ".8125rem",
            cursor: "pointer",
          }}
        >
          Clear all filters
        </button>
      ) : null}
    </>
  );

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
          Home
        </AppLink>
        <Icon name="chevronRight" size={13} color="var(--ink-300)" />
        <span style={{ color: "var(--ink-700)" }}>
          {urlQuery ? `Search: "${urlQuery}"` : "Search"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
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
        {/* Mobile-only: small filter icon, pinned to the right of the heading. */}
        <button
          type="button"
          aria-label="Filters"
          className="bz-show-mobile bz-show-mobile--flex"
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
              {isFetching && !data ? (
                "Searching…"
              ) : (
                <>
                  <b style={{ color: "var(--ink-900)" }}>{total.toLocaleString()}</b> products found
                  in {timeMs}ms
                </>
              )}
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
                onChange={(e) => setSort(e.target.value as NonNullable<SearchParams["sort"]>)}
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
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isFetching && !data ? (
            <div style={gridStyle}>
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
                No products match
              </div>
              <div style={{ fontSize: ".875rem" }}>
                Try a different search or clear your filters.
              </div>
            </div>
          ) : (
            <>
              <div style={gridStyle}>
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} onClick={openProduct} />
                ))}
              </div>
              <PageBar
                page={data?.page ?? 1}
                pageCount={data?.page_count ?? 1}
                alwaysShow={false}
                onPage={(n: number) => {
                  setPage(n);
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
              <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Filters</h3>
              <button
                onClick={() => setSheet(false)}
                aria-label="Close filters"
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
                Show {total.toLocaleString()} {total === 1 ? "result" : "results"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const priceInput: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid var(--line-200)",
  borderRadius: "var(--r-sm)",
  fontSize: ".8125rem",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
  gap: 16,
};

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
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

function FacetRow({
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

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "var(--ink-300)", fontSize: ".8125rem", padding: "2px 0" }}>
      {children}
    </div>
  );
}
