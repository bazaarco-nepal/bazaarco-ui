"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import { ProductCard, useBz } from "@/components/common";
import { useCatalog } from "@/shared/hooks/use-catalog";
import { useProductListing } from "@/buyer/hooks/use-search";
import { categoryIdsFromSearchParams, searchSortFromBrowseParam } from "@/config/routes";
import { displayCategoryLabel } from "@/shared/lib/locale-display";
import { useBazaarStore } from "@/store/bazaar-store";
import { recordRecentSearch } from "@/buyer/lib/recent-activity";
import type { SearchParams } from "@/buyer/api/search";
import { FacetedResultsLayout, ProductFacets, SortSelect } from "./faceted-results";

const PER_PAGE = 24;

/** Faceted search results — left filter rail + results grid, Algolia-backed.
 *  Shares its shell + filter block with the newest listing on /browse so both
 *  surfaces are identical; mobile lays the filters out in a bottom sheet. */
export function Search() {
  const { t } = useTranslation();
  const locale = useBazaarStore((s) => s.locale);
  const { openProduct } = useBz();
  const { categories: CATEGORIES } = useCatalog();
  const urlParams = useSearchParams();
  const urlQuery = urlParams.get("q")?.trim() ?? "";
  const catFromUrl = useMemo(() => categoryIdsFromSearchParams(urlParams), [urlParams]);
  const sortFromUrl = searchSortFromBrowseParam(urlParams.get("sort")) ?? "relevance";
  const minFromUrl = urlParams.get("price_min")?.trim() ?? "";
  const maxFromUrl = urlParams.get("price_max")?.trim() ?? "";

  const [cats, setCats] = useState<string[]>(catFromUrl);
  const [sellers, setSellers] = useState<string[]>([]);
  const [sellerSearch, setSellerSearch] = useState("");
  const [pmin, setPmin] = useState(minFromUrl);
  const [pmax, setPmax] = useState(maxFromUrl);
  const [appliedMin, setAppliedMin] = useState(minFromUrl);
  const [appliedMax, setAppliedMax] = useState(maxFromUrl);
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState<NonNullable<SearchParams["sort"]>>(sortFromUrl);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setCats(catFromUrl);
  }, [catFromUrl]);

  useEffect(() => {
    setSort(sortFromUrl);
  }, [sortFromUrl]);

  useEffect(() => {
    setPmin(minFromUrl);
    setAppliedMin(minFromUrl);
  }, [minFromUrl]);

  useEffect(() => {
    setPmax(maxFromUrl);
    setAppliedMax(maxFromUrl);
  }, [maxFromUrl]);

  useEffect(() => {
    if (urlQuery) recordRecentSearch(urlQuery);
  }, [urlQuery]);

  // Debounce the price inputs so typing a number doesn't fire a query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setAppliedMin(pmin);
      setAppliedMax(pmax);
    }, 400);
    return () => clearTimeout(id);
  }, [pmin, pmax]);

  const params: SearchParams = {
    query: urlQuery,
    categories: cats.length ? cats : undefined,
    sellers: sellers.length ? sellers : undefined,
    price_min: appliedMin !== "" ? Math.max(0, parseFloat(appliedMin) || 0) : undefined,
    price_max: appliedMax !== "" ? Math.max(0, parseFloat(appliedMax) || 0) : undefined,
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

  const { data, isFetching } = useProductListing(params);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const catFacets = data?.facets?.categories ?? [];
  const sellerFacets = useMemo(() => {
    const all = data?.facets?.sellers ?? [];
    const filtered = sellerSearch
      ? all.filter((s) => s.value.toLowerCase().includes(sellerSearch.toLowerCase()))
      : all;
    return filtered.slice(0, 12);
  }, [data, sellerSearch]);

  const sortOptions = useMemo(
    () => [
      { value: "relevance" as const, label: t("search.sortRelevance") },
      { value: "newest" as const, label: t("search.sortNewest") },
      { value: "rating" as const, label: t("search.sortTopRated") },
      { value: "price_low" as const, label: t("search.sortPriceLow") },
      { value: "price_high" as const, label: t("search.sortPriceHigh") },
    ],
    [t],
  );

  const catName = (id: string) => {
    const c = (CATEGORIES ?? []).find((cat) => cat.id === id);
    return c ? displayCategoryLabel(c, locale) : id;
  };

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

  const heading = (() => {
    if (urlQuery) return t("search.resultsFor", { query: urlQuery });
    if (cats.length === 1) return catName(cats[0]!);
    return t("search.allProducts");
  })();

  const filters = (
    <ProductFacets
      categoryRows={catFacets.map((c) => ({
        value: c.value,
        label: catName(c.value),
        count: c.count,
      }))}
      selectedCats={cats}
      onToggleCat={(v) => toggle(cats, setCats, v)}
      sellerRows={sellerFacets.map((s) => ({ value: s.value, label: s.value, count: s.count }))}
      selectedSellers={sellers}
      onToggleSeller={(v) => toggle(sellers, setSellers, v)}
      sellerSearch={sellerSearch}
      onSellerSearch={setSellerSearch}
      pmin={pmin}
      pmax={pmax}
      onPmin={setPmin}
      onPmax={setPmax}
      rating={rating}
      onRating={setRating}
      hasFilters={activeCount > 0}
      onClearAll={clearAll}
    />
  );

  return (
    <FacetedResultsLayout
      breadcrumbLabel={urlQuery ? t("search.searchLabel", { query: urlQuery }) : t("search.title")}
      heading={heading}
      filters={filters}
      sortControl={
        <SortSelect
          label={t("search.sort")}
          value={sort}
          options={sortOptions}
          onChange={setSort}
        />
      }
      activeCount={activeCount}
      items={items}
      total={total}
      isLoading={isFetching && !data}
      onOpenProduct={openProduct}
      page={data?.page ?? 1}
      pageCount={data?.page_count ?? 1}
      onPage={setPage}
    />
  );
}
