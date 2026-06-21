"use client";

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, Spinner, SectionHead, BackToTop, ApiState, AppLink } from "@/components/ui";
import {
  browsePath,
  searchPath,
  categoryIdsFromSearchParams,
  pathFromScreen,
} from "@/config/routes";
import { useCatalog } from "@/shared/hooks/use-catalog";
import { CategoryTile } from "@/components/common";

/** /browse is just the category browser now (?view=categories). Every product
 *  listing — queries, category/price/rating filters, and the newest sort — is a
 *  single faceted page on /search, so any other /browse URL redirects there. */
export function Browse() {
  const { t } = useTranslation();
  const router = useRouter();
  const urlParams = useSearchParams();
  const { categories: CATEGORIES, isLoading, isError, error } = useCatalog();

  const categoryView = urlParams.get("view") === "categories";
  const urlQuery = urlParams.get("q")?.trim() ?? "";
  const catFromUrl = categoryIdsFromSearchParams(urlParams);
  const sort = urlParams.get("sort")?.trim() ?? "";

  const isLegacyListing = !categoryView;

  useEffect(() => {
    if (!isLegacyListing) return;
    router.replace(
      searchPath({
        q: urlQuery || undefined,
        cat: catFromUrl.length ? catFromUrl : undefined,
        sort: sort || undefined,
      }),
      { scroll: false },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLegacyListing, urlQuery, catFromUrl.join(","), sort, router]);

  if (isLegacyListing) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "96px 24px" }}>
        <Spinner />
      </div>
    );
  }

  // Category browser (?view=categories).
  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "16px clamp(12px, 4vw, 28px) 48px",
        }}
      >
        <BackToTop />

        {/* Mobile */}
        <div className="bz-show-mobile bz-category-browser bz-home-categories">
          <SectionHead title={t("home.allCategories")} />
          <div className="bz-category-browser-grid">
            {(CATEGORIES ?? []).map((c) => (
              <CategoryTile
                key={c.id}
                c={c}
                variant="card"
                href={browsePath({ cat: c.id })}
                onClick={() => {}}
                shortOnMobile
              />
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="bz-hide-mobile">
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
              {t("common.home")}
            </AppLink>
            <Icon name="chevronRight" size={13} color="var(--ink-300)" />
            <span style={{ color: "var(--ink-700)" }}>{t("home.allCategories")}</span>
          </div>
          <div className="bz-category-browser">
            <SectionHead title={t("home.allCategories")} />
            <div className="bz-category-browser-grid">
              {(CATEGORIES ?? []).map((c) => (
                <CategoryTile
                  key={c.id}
                  c={c}
                  variant="card"
                  href={browsePath({ cat: c.id })}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ApiState>
  );
}
