"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  RatingStars,
  Chip,
  StatusPill,
  Price,
  Placeholder,
  VideoPlayer,
  SkeletonCard,
  EmptyState,
  QtyStepper,
  Toast,
  SectionHead,
  TINTS,
  AllInPriceCard,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  BottomNav,
  LandmarkAddress,
  VoiceMicButton,
  usePaged,
  usePages,
  LoadMore,
  PageBar,
  BackToTop,
  ApiState,
  AppLink,
} from "@/components/ui";
import { browsePath, categoryIdsFromSearchParams, pathFromScreen } from "@/config/routes";
import { useCatalog } from "@/hooks/use-catalog";
import { useSearch } from "@/hooks/use-search";
import type { SearchParams } from "@/services/api/search";
import {
  BazaarCtx,
  useBz,
  Himalaya,
  KathmanduSkyline,
  ProductCard,
  ProductRail,
  CategoryTile,
  Navbar,
  Footer,
  DevViewSwitcher,
} from "@/components/common";
import { ASSETS } from "@/config/assets";

const PLP_SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
  { value: "rating", label: "Rating" },
];

const PLP_QUICK_FILTERS = [
  { id: "cod", label: "Cash on delivery", icon: "wallet" },
  { id: "free", label: "Free delivery", icon: "truck" },
  { id: "returnable", label: "7-day return", icon: "refresh" },
  { id: "rating4", label: "4★ & up", icon: "star" },
];

/* Price preset bands — replace numeric slider for low-literacy users. */
const PLP_PRICE_BANDS = [
  { id: "u500", label: "Under Rs. 500", min: 0, max: 500 },
  { id: "500-1k", label: "Rs. 500 – 1,000", min: 500, max: 1000 },
  { id: "1k-2.5k", label: "Rs. 1,000 – 2,500", min: 1000, max: 2500 },
  { id: "2.5k-5k", label: "Rs. 2,500 – 5,000", min: 2500, max: 5000 },
  { id: "5k+", label: "Rs. 5,000 +", min: 5000, max: 1e9 },
];

/* Loosely-defined "accessory" detection — keeps search clean.
   For demo only; in real life this comes from a category-priority index. */
function isAccessory(p, q) {
  if (!q) return false;
  const ql = q.toLowerCase();
  const name = p.name.toLowerCase();
  if (ql.includes("laptop") && !name.includes("laptop")) return true;
  if (ql.includes("phone") && !name.includes("phone") && p.cat !== "electronics") return true;
  if (ql.includes("earbud") && !name.includes("earbud")) return true;
  return false;
}

function DidYouMean({ q, suggestions, onPick, onReset }) {
  const main = suggestions[0] || "";
  return (
    <div style={{ maxWidth: 560, margin: "32px auto", textAlign: "center" }}>
      <img
        src={ASSETS.mascot}
        alt=""
        style={{ width: 160, height: 160, objectFit: "contain", marginBottom: 8 }}
      />
      <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--ink-900)" }}>
        No matches for "{q}"
      </h3>
      <p style={{ color: "var(--ink-500)", margin: "8px 0 4px" }}>
        Did you mean{" "}
        <button
          onClick={() => onPick(main)}
          style={{
            background: "none",
            border: "none",
            color: "var(--blue)",
            fontWeight: 800,
            cursor: "pointer",
            padding: 0,
            font: "inherit",
            textDecoration: "underline",
          }}
        >
          "{main}"
        </button>
        ?
      </p>
      <div className="ne" style={{ color: "var(--ink-400)", fontSize: ".875rem" }}>
        के यो खोज्दै हुनुहुन्थ्यो?
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 18,
        }}
      >
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--r-full)",
              border: "1.5px solid var(--line-200)",
              background: "#fff",
              color: "var(--ink-700)",
              fontWeight: 700,
              fontSize: ".875rem",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Button variant="secondary" onClick={onReset}>
          Browse categories
        </Button>
      </div>
    </div>
  );
}

/* Phonetic correction examples — Nepglish auto-correct */
const PHONETIC = {
  lapatop: "laptop",
  leptop: "laptop",
  motarsaikal: "motorcycle",
  fon: "phone",
  phonn: "phone",
  earbud: "earbuds",
  shol: "shawl",
  kurtha: "kurta",
};

export function Browse() {
  const { openProduct, nav, query, setQuery } = useBz();
  const router = useRouter();
  const pathname = usePathname();
  const catalog = useCatalog();
  const {
    products: PRODUCTS,
    categories: CATEGORIES,
    sellerOf,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErr,
  } = catalog;
  const [loading, setLoading] = useState(true);
  const urlParams = useSearchParams();
  const catParam = urlParams.get("cat") ?? "";
  const catFromUrl = useMemo(() => categoryIdsFromSearchParams(urlParams), [catParam]);
  const [cats, setCats] = useState(catFromUrl);
  const [quick, setQuick] = useState([]);
  const [priceBand, setPriceBand] = useState(null); // band id or null
  const [priceMin, setPriceMin] = useState(""); // custom min — overrides band when set
  const [priceMax, setPriceMax] = useState(""); // custom max — overrides band when set
  const initialSort = (() => {
    const fromUrl = urlParams.get("sort");
    return fromUrl && PLP_SORT_OPTIONS.some((o) => o.value === fromUrl) ? fromUrl : "popular";
  })();
  const [sort, setSort] = useState(initialSort);
  const [sheet, setSheet] = useState(false);

  // Keep category filters in sync when landing via ?cat= from home or mobile category tap.
  useEffect(() => {
    setCats(catFromUrl);
  }, [catFromUrl]);

  useEffect(() => {
    const next = browsePath({
      q: query?.trim() || undefined,
      cat: cats.length ? cats : undefined,
      sort: sort !== "popular" ? sort : undefined,
    });
    if (typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search;
      if (current !== next) {
        router.replace(next, { scroll: false });
      }
    }
  }, [cats, query, sort, router]);

  const correctedQuery = (query && PHONETIC[query.toLowerCase().trim()]) || query;
  const effectiveQuery = correctedQuery;
  const band = PLP_PRICE_BANDS.find((b) => b.id === priceBand);
  // Custom min/max take precedence over preset band.
  const customMin = priceMin === "" ? null : Math.max(0, parseInt(priceMin, 10) || 0);
  const customMax = priceMax === "" ? null : Math.max(0, parseInt(priceMax, 10) || 0);
  const usingCustomPrice = customMin !== null || customMax !== null;
  const effMin = usingCustomPrice ? (customMin ?? 0) : band ? band.min : 0;
  const effMax = usingCustomPrice ? (customMax ?? 1e9) : band ? band.max : 1e9;
  const priceActive = usingCustomPrice || !!band;
  const priceLabel = usingCustomPrice
    ? `Rs. ${customMin ?? 0}${customMax !== null ? ` – ${customMax}` : "+"}`
    : band
      ? band.label
      : "";

  const SORT_MAP: Record<string, SearchParams["sort"]> = {
    popular: "relevance",
    low: "price_low",
    high: "price_high",
    rating: "rating",
  };

  const searchParams: SearchParams | null = effectiveQuery
    ? {
        query: effectiveQuery,
        categories: cats.length ? cats : undefined,
        price_min: priceActive ? effMin : undefined,
        price_max: priceActive && effMax < 1e9 ? effMax : undefined,
        rating4: quick.includes("rating4") || undefined,
        free: quick.includes("free") || undefined,
        sort: SORT_MAP[sort] ?? "relevance",
        page: 1,
        limit: 50,
      }
    : null;

  const { data: searchData, isLoading: searchLoading } = useSearch(searchParams);

  useEffect(() => {
    if (catalogLoading || searchLoading) return;
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(id);
  }, [cats, quick, priceBand, priceMin, priceMax, query, sort, catalogLoading, searchLoading]);

  const searchProducts = useMemo(() => {
    if (!searchData?.items?.length) return null;
    return searchData.items;
  }, [searchData]);

  let matches = searchProducts
    ? searchProducts
    : PRODUCTS.filter((p) => {
        if (
          effectiveQuery &&
          !`${p.name} ${p.ne} ${sellerOf(p)?.name ?? ""}`
            .toLowerCase()
            .includes(effectiveQuery.toLowerCase())
        )
          return false;
        if (cats.length && !cats.includes(p.cat)) return false;
        if (priceActive && (p.price < effMin || p.price > effMax)) return false;
        if (quick.includes("free") && p.price < 1000) return false;
        if (quick.includes("rating4") && p.rating < 4) return false;
        return true;
      });

  if (!searchProducts) {
    if (sort === "low") matches.sort((a, b) => a.price - b.price);
    else if (sort === "high") matches.sort((a, b) => b.price - a.price);
    else if (sort === "rating") matches.sort((a, b) => b.rating - a.rating);
    else if (sort === "newest")
      matches.sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0),
      );
  }

  const strict = matches.filter((p) => !isAccessory(p, effectiveQuery) && !p.outOfStock);
  const related = matches.filter((p) => isAccessory(p, effectiveQuery) && !p.outOfStock);
  const oos = matches.filter((p) => p.outOfStock);

  const toggleCat = (id) =>
    setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const toggleQuick = (id) =>
    setQuick((q) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]));
  const clearPrice = () => {
    setPriceBand(null);
    setPriceMin("");
    setPriceMax("");
  };
  const clearAll = () => {
    setCats([]);
    setQuick([]);
    clearPrice();
  };

  const totalCount = strict.length + related.length;
  const showDidYouMean = !loading && query && totalCount === 0;
  const suggestions = ["pashmina", "kurta", "earbuds", "honey", "topi"]
    .filter((s) => s !== effectiveQuery.toLowerCase())
    .slice(0, 4);

  // Active filters — labeled chips with one-tap removal.
  const activeChips = [
    ...quick.map((id) => {
      const f = PLP_QUICK_FILTERS.find((x) => x.id === id);
      return f && { key: `q-${id}`, label: f.label, onRemove: () => toggleQuick(id) };
    }),
    ...cats.map((id) => {
      const c = (CATEGORIES ?? []).find((x) => x.id === id);
      return c && { key: `c-${id}`, label: c.en, onRemove: () => toggleCat(id) };
    }),
    priceActive && { key: "p-range", label: priceLabel, onRemove: clearPrice },
  ].filter(Boolean);
  const hasActive = activeChips.length > 0;

  const browseHeading = (() => {
    if (query) return `Results for "${query}"`;
    if (cats.length === 1) {
      const c = (CATEGORIES ?? []).find((x) => x.id === cats[0]);
      return c?.en ?? "Products";
    }
    if (cats.length > 1) return "Filtered products";
    return "All products";
  })();

  const browseCrumb = (() => {
    if (query) return `Search: "${query}"`;
    if (cats.length === 1) {
      const c = (CATEGORIES ?? []).find((x) => x.id === cats[0]);
      return c?.en ?? "Category";
    }
    return "All products";
  })();

  // Paginate in-stock matches. Reset to page 1 whenever the filter signature changes.
  const filterKey = `${effectiveQuery}|${cats.join(",")}|${quick.join(",")}|${sort}|${priceLabel}`;
  const strictPaged = usePaged(strict, 24, filterKey);
  const mobilePaged = usePaged(strict.concat(related), 20, filterKey);

  return (
    <ApiState isLoading={catalogLoading} isError={catalogError} error={catalogErr}>
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "16px clamp(12px, 4vw, 28px) 0",
        }}
      >
        <BackToTop />
        {/* Mobile browse — sticky filter bar + product list when filtered, category grid otherwise */}
        <div className="bz-show-mobile">
          {/* Sticky horizontal chip bar — research-aligned 5 universal filters + More.
              Only in results mode (a query or active filter). On the category-grid
              landing it's noise: filters act on product results, not category picking. */}
          {(hasActive || query) && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                padding: "4px 0 12px",
                margin: "0 -8px",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <button
                onClick={() => setSheet(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  minHeight: 44,
                  flexShrink: 0,
                  borderRadius: "var(--r-full)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  border: "1.5px solid var(--ink-900)",
                  background: "var(--ink-900)",
                  color: "#fff",
                  marginLeft: 8,
                }}
              >
                <Icon name="sliders" size={16} color="#fff" /> Filter
                {hasActive && (
                  <span
                    style={{
                      background: "var(--red)",
                      color: "#fff",
                      borderRadius: "var(--r-full)",
                      padding: "1px 7px",
                      fontSize: ".7rem",
                      fontWeight: 800,
                    }}
                  >
                    {activeChips.length}
                  </span>
                )}
              </button>
              {PLP_QUICK_FILTERS.map((f) => {
                const on = quick.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleQuick(f.id)}
                    aria-pressed={on}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 14px",
                      minHeight: 44,
                      flexShrink: 0,
                      borderRadius: "var(--r-full)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: ".8125rem",
                      whiteSpace: "nowrap",
                      border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                      background: on ? "var(--tint-blue-50)" : "#fff",
                      color: on ? "var(--blue)" : "var(--ink-700)",
                    }}
                  >
                    <Icon name={f.icon} size={14} color={on ? "var(--blue)" : "var(--ink-500)"} />
                    {f.label}
                  </button>
                );
              })}
              <div style={{ width: 8, flexShrink: 0 }} />
            </div>
          )}

          {/* Active filter chips with × */}
          {hasActive && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 14,
                padding: "10px 12px",
                background: "var(--line-100)",
                borderRadius: "var(--r-md)",
              }}
            >
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.onRemove}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 6px 6px 12px",
                    borderRadius: "var(--r-full)",
                    border: "1.5px solid var(--blue)",
                    background: "#fff",
                    color: "var(--blue)",
                    fontWeight: 700,
                    fontSize: ".75rem",
                    cursor: "pointer",
                    minHeight: 32,
                  }}
                >
                  {c.label}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      borderRadius: "var(--r-full)",
                      background: "var(--blue)",
                      color: "#fff",
                    }}
                  >
                    <Icon name="x" size={10} color="#fff" />
                  </span>
                </button>
              ))}
              <button
                onClick={clearAll}
                style={{
                  marginLeft: "auto",
                  padding: "5px 10px",
                  borderRadius: "var(--r-full)",
                  border: "none",
                  background: "none",
                  color: "var(--ink-500)",
                  fontWeight: 700,
                  fontSize: ".75rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* When no filters AND no query → category browser. Otherwise product grid. */}
          {!hasActive && !query ? (
            <>
              <h2
                style={{
                  margin: "4px 0 14px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                }}
              >
                Shop by category
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "20px 8px",
                  paddingBottom: 24,
                }}
              >
                {(CATEGORIES ?? []).map((c) => (
                  <CategoryTile key={c.id} c={c} onClick={() => setCats([c.id])} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div
                className="tnum"
                style={{
                  fontSize: ".8125rem",
                  color: "var(--ink-500)",
                  margin: "0 0 10px",
                  fontWeight: 700,
                }}
              >
                {loading ? "Searching…" : `${totalCount} product${totalCount === 1 ? "" : "s"}`}
              </div>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : totalCount === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "var(--ink-900)",
                      marginBottom: 4,
                    }}
                  >
                    No products match
                  </div>
                  <div style={{ color: "var(--ink-500)", fontSize: ".8125rem", marginBottom: 14 }}>
                    Try removing a filter:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    {activeChips.map((c) => (
                      <button
                        key={c.key}
                        onClick={c.onRemove}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          minHeight: 40,
                          borderRadius: "var(--r-full)",
                          border: "1.5px solid var(--line-200)",
                          background: "#fff",
                          color: "var(--ink-700)",
                          fontWeight: 700,
                          fontSize: ".8125rem",
                          cursor: "pointer",
                        }}
                      >
                        Remove "{c.label}" <Icon name="x" size={12} color="var(--ink-500)" />
                      </button>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={clearAll}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {mobilePaged.visible.map((p) => (
                      <ProductCard key={p.id} p={p} onClick={openProduct} />
                    ))}
                  </div>
                  <LoadMore
                    paged={mobilePaged}
                    noun="products"
                    onClear={hasActive ? clearAll : undefined}
                    style={{ marginTop: 20, paddingBottom: 24 }}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Desktop browse — hidden on mobile */}
        <div className="bz-hide-mobile">
          {/* sticky search reminder + breadcrumb */}
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
            <span style={{ color: "var(--ink-700)" }}>{browseCrumb}</span>
          </div>

          {/* corrected query banner */}
          {correctedQuery !== query && (
            <div
              style={{
                background: "var(--tint-blue-50)",
                color: "var(--blue-deep)",
                padding: "10px 14px",
                borderRadius: "var(--r-md)",
                marginBottom: 14,
                fontSize: ".875rem",
              }}
            >
              Showing results for <b>"{correctedQuery}"</b> ·{" "}
              <button
                onClick={() => setQuery(query)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--blue)",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  font: "inherit",
                }}
              >
                search instead for "{query}"
              </button>
            </div>
          )}

          {/* Header row + sort chips */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 14,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                }}
              >
                {browseHeading}
              </h1>
              <div
                className="tnum"
                style={{ fontSize: ".875rem", color: "var(--ink-400)", marginTop: 4 }}
              >
                {loading ? "Searching…" : `${totalCount} product${totalCount === 1 ? "" : "s"}`}
                {oos.length > 0 && <span> · {oos.length} out of stock</span>}
              </div>
            </div>
          </div>

          {/* Shop by category — placed directly below search/header (Amazon pattern) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontSize: ".75rem",
                fontWeight: 700,
                color: "var(--ink-400)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginRight: 4,
              }}
            >
              Shop by
            </span>
            {(CATEGORIES ?? []).map((c) => {
              const on = cats.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCat(c.id)}
                  aria-pressed={on}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--r-full)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: ".75rem",
                    border: `1px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                    background: on ? "var(--tint-blue-50)" : "var(--line-100)",
                    color: on ? "var(--blue)" : "var(--ink-500)",
                  }}
                >
                  {c.en}
                </button>
              );
            })}
          </div>

          {/* Sort — segmented control, distinct from filters */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: ".75rem",
                fontWeight: 700,
                color: "var(--ink-400)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Sort by
            </span>
            <div
              style={{
                display: "inline-flex",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-full)",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {PLP_SORT_OPTIONS.map((o, i) => (
                <button
                  key={o.value}
                  onClick={() => setSort(o.value)}
                  aria-pressed={sort === o.value}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    background: sort === o.value ? "var(--blue-deep)" : "transparent",
                    color: sort === o.value ? "#fff" : "var(--ink-700)",
                    fontWeight: 700,
                    fontSize: ".8125rem",
                    whiteSpace: "nowrap",
                    borderLeft: i === 0 ? "none" : "1px solid var(--line-200)",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick filters — 5 high-signal trust/delivery chips, bigger tap area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: ".75rem",
                fontWeight: 700,
                color: "var(--ink-400)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginRight: 4,
              }}
            >
              Filter
            </span>
            {PLP_QUICK_FILTERS.map((f) => {
              const on = quick.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleQuick(f.id)}
                  aria-pressed={on}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: "var(--r-full)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: ".8125rem",
                    minHeight: 36,
                    border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                    background: on ? "var(--tint-blue-50)" : "#fff",
                    color: on ? "var(--blue)" : "var(--ink-700)",
                  }}
                >
                  <Icon name={f.icon} size={14} color={on ? "var(--blue)" : "var(--ink-500)"} />
                  {f.label}
                </button>
              );
            })}
            <button
              onClick={() => setSheet(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: "var(--r-full)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: ".8125rem",
                minHeight: 36,
                border: "1.5px solid var(--line-200)",
                background: "#fff",
                color: "var(--ink-700)",
              }}
            >
              <Icon name="sliders" size={14} /> Price · More
            </button>
          </div>

          {/* Active filter chips — one-tap removal */}
          {hasActive && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 22,
                padding: "10px 12px",
                background: "var(--line-100)",
                borderRadius: "var(--r-md)",
              }}
            >
              <span style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--ink-500)" }}>
                Active:
              </span>
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.onRemove}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 6px 5px 11px",
                    borderRadius: "var(--r-full)",
                    border: "1.5px solid var(--blue)",
                    background: "#fff",
                    color: "var(--blue)",
                    fontWeight: 700,
                    fontSize: ".75rem",
                    cursor: "pointer",
                  }}
                >
                  {c.label}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      borderRadius: "var(--r-full)",
                      background: "var(--blue)",
                      color: "#fff",
                    }}
                  >
                    <Icon name="x" size={10} color="#fff" />
                  </span>
                </button>
              ))}
              <button
                onClick={clearAll}
                style={{
                  marginLeft: "auto",
                  padding: "5px 11px",
                  borderRadius: "var(--r-full)",
                  border: "none",
                  background: "none",
                  color: "var(--ink-500)",
                  fontWeight: 700,
                  fontSize: ".75rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* grid */}
          {loading ? (
            <div
              className="bz-grid-cards"
              style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : showDidYouMean ? (
            <DidYouMean
              q={query}
              suggestions={suggestions}
              onPick={(s) => setQuery(s)}
              onReset={() => {
                setQuery("");
                clearAll();
              }}
            />
          ) : totalCount === 0 ? (
            <div style={{ maxWidth: 480, margin: "40px auto", textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  color: "var(--ink-900)",
                  marginBottom: 4,
                }}
              >
                No products match your filters
              </div>
              <div style={{ color: "var(--ink-500)", fontSize: ".875rem", marginBottom: 14 }}>
                {hasActive ? "Try removing one of these filters:" : "Try browsing by category."}
              </div>
              {hasActive && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  {activeChips.map((c) => (
                    <button
                      key={c.key}
                      onClick={c.onRemove}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: "var(--r-full)",
                        border: "1.5px solid var(--line-200)",
                        background: "#fff",
                        color: "var(--ink-700)",
                        fontWeight: 700,
                        fontSize: ".8125rem",
                        cursor: "pointer",
                      }}
                    >
                      Remove "{c.label}"
                      <Icon name="x" size={12} color="var(--ink-500)" />
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Button variant="secondary" onClick={clearAll}>
                  Clear all filters
                </Button>
                <Button variant="ghost" href={pathFromScreen("home")}>
                  Back to home
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="bz-grid-cards"
                style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}
              >
                {strictPaged.visible.map((p) => (
                  <ProductCard key={p.id} p={p} onClick={openProduct} />
                ))}
              </div>
              <LoadMore
                paged={strictPaged}
                noun="products"
                onClear={hasActive ? clearAll : undefined}
                pageBar={
                  <PageBar
                    page={strictPaged.page}
                    pageCount={strictPaged.pageCount}
                    onPage={strictPaged.goPage}
                  />
                }
              />

              {/* Related accessories — pushed below strict matches */}
              {related.length > 0 && (
                <div style={{ marginTop: 36 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      margin: "0 0 14px",
                      color: "var(--ink-500)",
                    }}
                  >
                    <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
                    <span
                      style={{
                        fontSize: ".8125rem",
                        fontWeight: 700,
                        color: "var(--ink-500)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Related accessories
                    </span>
                    <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
                  </div>
                  <div
                    className="bz-grid-cards"
                    style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}
                  >
                    {related.map((p) => (
                      <ProductCard key={p.id} p={p} onClick={openProduct} />
                    ))}
                  </div>
                </div>
              )}

              {/* Out of stock — sunk to bottom with overlay */}
              {oos.length > 0 && (
                <div style={{ marginTop: 36 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      margin: "0 0 14px",
                      color: "var(--ink-500)",
                    }}
                  >
                    <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
                    <span
                      style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-500)" }}
                    >
                      Coming Soon · चाँडै आउँदै
                    </span>
                    <span style={{ flex: 1, height: 1, background: "var(--line-200)" }} />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 18,
                      opacity: 0.55,
                    }}
                    className="bz-grid-cards"
                  >
                    {oos.map((p) => (
                      <ProductCard key={p.id} p={p} onClick={openProduct} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* end bz-hide-mobile desktop browse */}

        {/* Mobile filter sheet — preset-driven, no slider */}
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
                padding: "20px 22px 0",
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
                  marginBottom: 16,
                  flexShrink: 0,
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Filters</h3>
                <button
                  onClick={() => setSheet(false)}
                  aria-label="Close"
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

              <div style={{ overflowY: "auto", paddingBottom: 12 }}>
                {/* Trust + delivery — same 5 chips as top bar, for users who never see top bar */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: ".875rem" }}>
                    What matters most
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {PLP_QUICK_FILTERS.map((f) => {
                      const on = quick.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleQuick(f.id)}
                          aria-pressed={on}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 14px",
                            minHeight: 44,
                            borderRadius: "var(--r-full)",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: ".875rem",
                            border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                            background: on ? "var(--tint-blue-50)" : "#fff",
                            color: on ? "var(--blue)" : "var(--ink-700)",
                          }}
                        >
                          <Icon
                            name={f.icon}
                            size={16}
                            color={on ? "var(--blue)" : "var(--ink-500)"}
                          />
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price band — preset buttons, no slider */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: ".875rem" }}>
                    Choose your budget
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {PLP_PRICE_BANDS.map((b) => {
                      const on = priceBand === b.id && !usingCustomPrice;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            setPriceMin("");
                            setPriceMax("");
                            setPriceBand(on ? null : b.id);
                          }}
                          aria-pressed={on}
                          style={{
                            padding: "12px 10px",
                            minHeight: 48,
                            borderRadius: "var(--r-md)",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: ".875rem",
                            border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                            background: on ? "var(--tint-blue-50)" : "#fff",
                            color: on ? "var(--blue)" : "var(--ink-700)",
                          }}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom min / max — overrides preset when used */}
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: ".75rem",
                      color: "var(--ink-500)",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Or enter your own range
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: ".8125rem",
                          color: "var(--ink-400)",
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        Rs.
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => {
                          setPriceMin(e.target.value.replace(/[^0-9]/g, ""));
                          if (e.target.value) setPriceBand(null);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 38px",
                          height: 44,
                          border: `1.5px solid ${usingCustomPrice ? "var(--blue)" : "var(--line-200)"}`,
                          borderRadius: "var(--r-md)",
                          fontSize: ".9375rem",
                          background: "#fff",
                          color: "var(--ink-900)",
                          outline: "none",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                    <span style={{ color: "var(--ink-400)", fontWeight: 700 }}>—</span>
                    <div style={{ flex: 1, position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: ".8125rem",
                          color: "var(--ink-400)",
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        Rs.
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => {
                          setPriceMax(e.target.value.replace(/[^0-9]/g, ""));
                          if (e.target.value) setPriceBand(null);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 38px",
                          height: 44,
                          border: `1.5px solid ${usingCustomPrice ? "var(--blue)" : "var(--line-200)"}`,
                          borderRadius: "var(--r-md)",
                          fontSize: ".9375rem",
                          background: "#fff",
                          color: "var(--ink-900)",
                          outline: "none",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                  </div>
                  {usingCustomPrice && (
                    <button
                      onClick={() => {
                        setPriceMin("");
                        setPriceMax("");
                      }}
                      style={{
                        marginTop: 8,
                        padding: "4px 0",
                        border: "none",
                        background: "none",
                        color: "var(--ink-500)",
                        fontWeight: 700,
                        fontSize: ".75rem",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Clear custom range
                    </button>
                  )}
                </div>

                {/* Category */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: ".875rem" }}>
                    Category
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(CATEGORIES ?? []).map((c) => {
                      const on = cats.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCat(c.id)}
                          aria-pressed={on}
                          style={{
                            padding: "10px 14px",
                            minHeight: 44,
                            borderRadius: "var(--r-full)",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: ".875rem",
                            border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                            background: on ? "var(--tint-blue-50)" : "#fff",
                            color: on ? "var(--blue)" : "var(--ink-700)",
                          }}
                        >
                          {c.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  position: "sticky",
                  bottom: 0,
                  background: "#fff",
                  padding: "12px 0 16px",
                  borderTop: "1px solid var(--line-200)",
                  flexShrink: 0,
                }}
              >
                <Button variant="ghost" full onClick={clearAll}>
                  Clear all
                </Button>
                <Button variant="primary" full onClick={() => setSheet(false)}>
                  Show {totalCount} product{totalCount === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ApiState>
  );
}
