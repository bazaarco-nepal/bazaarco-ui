"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Button,
  RatingStars,
  EmptyState,
  ApiState,
  SkeletonCard,
  StoreAvatar,
  AppLink,
  LocalErrorBoundary,
} from "@/components/ui";
import { toast } from "@/shared/lib/toast";
import { BuyerAvatar, ProductCard, useBz } from "@/components/common";
import {
  useSeller,
  useSellerReviews,
  useSellerProducts,
  useCreateSellerReview,
  useCategories,
  useSellerFollowMutation,
  useSellerFollowState,
} from "@/shared/hooks/use-catalog";
import { storeIdFromPath, pathFromScreen } from "@/config/routes";
import { useBazaarStore } from "@/store/bazaar-store";
import type { StoreProductSort } from "@/shared/api/catalog";
import type { Seller } from "@/types";
import { SortSelect } from "@/buyer/features/search/faceted-results";

const RATING_LABEL_KEYS = [
  "",
  "store.ratingBad",
  "store.ratingNotGreat",
  "store.ratingOkay",
  "store.ratingGood",
  "store.ratingExcellent",
];

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function RateStoreModal({ seller, onClose }: { seller: Seller; onClose: () => void }) {
  const { t } = useTranslation();
  const createReview = useCreateSellerReview(seller.id);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  const canSubmit = stars > 0 && text.trim().length > 0 && !createReview.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await createReview.mutateAsync({ stars, text: text.trim() });
      toast.success(t("store.reviewPosted"));
      onClose();
    } catch {
      toast.error(t("store.reviewPostFailed"));
    }
  };

  const shown = hover || stars;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="bz-modal"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: "var(--r-lg)",
          padding: 24,
          boxShadow: "var(--sh-3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--ink-900)" }}>
            {t("store.rateSeller", { name: seller.name })}
          </h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            style={{
              marginLeft: "auto",
              width: 32,
              height: 32,
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-200)",
              background: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-500)",
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {t("store.reviewHelpHint")}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={t("store.starsAria", { count: s })}
              onClick={() => setStars(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              <Icon
                name="star"
                size={40}
                color={s <= shown ? "var(--gold)" : "var(--line-200)"}
                fill={s <= shown ? "var(--gold)" : "var(--line-200)"}
              />
            </button>
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            minHeight: 20,
            marginBottom: 16,
            fontSize: ".875rem",
            fontWeight: 600,
            color: "var(--ink-500)",
          }}
        >
          {shown ? t(RATING_LABEL_KEYS[shown] ?? "") : ""}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t("store.reviewPlaceholder")}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--line-200)",
            fontFamily: "var(--font-sans)",
            fontSize: ".9375rem",
            color: "var(--ink-900)",
            marginBottom: 18,
          }}
        />

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            icon="star"
            disabled={!canSubmit}
            loading={createReview.isPending}
            onClick={() => void submit()}
          >
            {t("store.postReview")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Store() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const urlParams = useSearchParams();
  // Prefer the URL once it commits; fall back to the id seeded by openStore so an
  // optimistic open renders this store directly instead of with a null id.
  const activeStoreId = useBazaarStore((s) => s.activeStoreId);
  const storeId = storeIdFromPath(pathname) ?? activeStoreId;
  const { openProduct, nav, authed, promptLogin } = useBz();

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
  const sortFromUrl = (
    ["relevance", "newest", "rating", "price_low", "price_high"].includes(
      urlParams.get("sort") ?? "",
    )
      ? urlParams.get("sort")
      : "relevance"
  ) as StoreProductSort;
  const [tab, setTab] = useState<"products" | "reviews">("products");
  const [rating, setRating] = useState(false);
  const [search, setSearch] = useState(urlParams.get("q") ?? "");
  const [category, setCategory] = useState(urlParams.get("cat") ?? "");
  const [sort, setSort] = useState<StoreProductSort>(sortFromUrl);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("cat", category);
    if (sort !== "relevance") params.set("sort", sort);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [category, pathname, router, search, sort]);

  const productParams = useMemo(
    () => ({
      q: search,
      categories: category ? [category] : undefined,
      sort,
    }),
    [category, search, sort],
  );

  const sellerQuery = useSeller(storeId);
  const reviewsQuery = useSellerReviews(storeId);
  const productsQuery = useSellerProducts(storeId, productParams);
  const allProductsQuery = useSellerProducts(storeId);
  const categoriesQuery = useCategories();
  const followQuery = useSellerFollowState(storeId, authed);
  const followMutation = useSellerFollowMutation(storeId);

  const seller = sellerQuery.data;
  const reviews = reviewsQuery.data ?? [];
  const productsPage = productsQuery.data;
  const products = productsPage?.items ?? [];
  const baseProductCount = allProductsQuery.data?.total ?? productsPage?.total ?? products.length;
  const followerCountFromApi = followQuery.data?.followerCount ?? seller?.followerCount ?? 0;
  const isFollowingFromApi = followQuery.data?.isFollowing ?? seller?.isFollowing ?? false;
  const [followerCount, setFollowerCount] = useState(followerCountFromApi);
  const [isFollowing, setIsFollowing] = useState(isFollowingFromApi);

  useEffect(() => {
    setFollowerCount(followerCountFromApi);
    setIsFollowing(isFollowingFromApi);
  }, [followerCountFromApi, isFollowingFromApi]);

  const isLoading = sellerQuery.isLoading || reviewsQuery.isLoading || allProductsQuery.isLoading;
  const isError = sellerQuery.isError;
  const error = sellerQuery.error;

  const categoryLabels = useMemo(() => {
    return new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.en]));
  }, [categoriesQuery.data]);
  const categoryRows =
    productsPage?.facets?.categories ?? allProductsQuery.data?.facets?.categories ?? [];

  const openRate = () => {
    if (!authed) {
      promptLogin(t("store.signInToReview"));
      return;
    }
    setRating(true);
  };

  const openChat = () => {
    if (!seller) return;
    if (!authed) {
      promptLogin(t("store.signInToChat"));
      return;
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("bz_open_chat_seller", seller.id);
    }
    nav("messages");
  };

  const toggleFollow = async () => {
    if (!authed) {
      promptLogin("Please sign in to follow this store.");
      return;
    }
    const next = !isFollowing;
    const prevFollowing = isFollowing;
    const prevCount = followerCount;
    setIsFollowing(next);
    setFollowerCount(Math.max(0, prevCount + (next ? 1 : -1)));
    try {
      const data = await followMutation.mutateAsync(next);
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.followerCount);
    } catch {
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
      toast.error("Could not update follow status");
    }
  };

  const shareStore = async () => {
    if (!seller) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: seller.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Store link copied");
    } catch {
      toast.error("Could not share store");
    }
  };

  return (
    <ApiState
      isLoading={isLoading}
      isError={isError}
      error={error}
      fallback={
        <div
          className="bz-store-page"
          style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px" }}
        >
          <div
            className="bz-grid-cards"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      }
    >
      {seller && (
        <div className="bz-storefront-page">
          <div className="bz-storefront-crumbs">
            <AppLink href={pathFromScreen("home")} className="bz-crumb">
              {t("common.home")}
            </AppLink>
            <Icon name="chevronRight" size={13} color="var(--ink-300)" />
            <AppLink href={pathFromScreen("stores")} className="bz-crumb">
              {t("screens.stores")}
            </AppLink>
            <Icon name="chevronRight" size={13} color="var(--ink-300)" />
            <span>{seller.name}</span>
          </div>

          {seller.bannerUrl ? (
            <div className="bz-storefront-banner">
              <img src={seller.bannerUrl} alt="" />
            </div>
          ) : null}

          <section className={`bz-storefront-card${seller.bannerUrl ? " has-banner" : ""}`}>
            <div className="bz-storefront-logo">
              <StoreAvatar src={seller.avatar} name={seller.name} size={96} />
            </div>
            <div className="bz-storefront-info">
              <div className="bz-storefront-title-row">
                <h1>{seller.name}</h1>
                {seller.verified ? <Icon name="badgeCheck" size={18} color="var(--blue)" /> : null}
              </div>
              <div className="bz-storefront-meta">
                {seller.rating > 0 ? (
                  <RatingStars value={seller.rating} size={15} showVal count={seller.reviews} />
                ) : (
                  <span>{t("store.noRatings")}</span>
                )}
                <span className="tnum">{baseProductCount.toLocaleString("en-IN")} products</span>
                <span className="tnum">{followerCount.toLocaleString("en-IN")} followers</span>
              </div>
              {seller.aboutText ? <p className="bz-storefront-bio">{seller.aboutText}</p> : null}
            </div>
            <div className="bz-storefront-actions">
              <Button
                variant="primary"
                size="md"
                icon={isFollowing ? "check" : "plus"}
                loading={followMutation.isPending}
                onClick={() => void toggleFollow()}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="secondary" size="md" icon="messageDots" onClick={openChat}>
                {t("store.chatWithSeller")}
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon="share"
                aria-label="Share"
                onClick={shareStore}
              >
                Share
              </Button>
            </div>
          </section>

          <div className="bz-storefront-tabs">
            {(
              [
                { id: "products", label: t("store.tabProducts"), count: baseProductCount },
                { id: "reviews", label: t("store.tabReviews"), count: reviews.length },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(t.id)}
                  className={active ? "is-active" : undefined}
                >
                  <span className="bz-storefront-tab-label">{t.label}</span>
                  <span className="bz-storefront-count tnum">{t.count}</span>
                </button>
              );
            })}
          </div>

          {tab === "products" && (
            <>
              <div className="bz-storefront-toolbar">
                <label className="bz-storefront-search">
                  <Icon name="search" size={18} color="var(--ink-400)" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search this store"
                    aria-label="Search this store"
                  />
                </label>
                <SortSelect
                  label={t("search.sort")}
                  value={sort}
                  options={sortOptions}
                  onChange={setSort}
                />
              </div>
              <div className="bz-storefront-category-row">
                <button
                  type="button"
                  className={!category ? "is-active" : undefined}
                  onClick={() => setCategory("")}
                >
                  <span className="bz-storefront-chip-label">All</span>
                  <span className="bz-storefront-count tnum">{baseProductCount}</span>
                </button>
                {categoryRows.map((row) => (
                  <button
                    key={row.value}
                    type="button"
                    className={category === row.value ? "is-active" : undefined}
                    onClick={() => setCategory(category === row.value ? "" : row.value)}
                  >
                    <span className="bz-storefront-chip-label">
                      {categoryLabels.get(row.value) ?? row.value}
                    </span>
                    <span className="bz-storefront-count tnum">{row.count}</span>
                  </button>
                ))}
              </div>
              <div className="bz-storefront-result-count tnum">
                {productsQuery.isFetching && !productsPage
                  ? t("search.searching")
                  : t("search.productsFound", {
                      count: (productsPage?.total ?? products.length).toLocaleString("en-IN"),
                    })}
              </div>
              {products.length === 0 ? (
                <EmptyState
                  title={t("store.noProductsTitle")}
                  message={t("store.noProductsMessage")}
                />
              ) : (
                <div className="bz-storefront-grid">
                  {products.map((p) => (
                    <ProductCard key={p.id} p={p} onClick={openProduct} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "reviews" && (
            <LocalErrorBoundary label="store-reviews">
              <div className="bz-storefront-reviews">
                {reviews.length === 0 ? (
                  <EmptyState
                    title={t("store.noReviewsTitle")}
                    message={t("store.noReviewsMessage")}
                    cta={t("reviews.writeReview")}
                    onCta={openRate}
                  />
                ) : (
                  <div className="bz-storefront-review-list">
                    {reviews.map((r) => (
                      <div key={r.id} className="bz-storefront-review">
                        <div className="bz-storefront-review__head">
                          <BuyerAvatar
                            src={r.avatar}
                            name={r.buyer}
                            size={34}
                            fontSize=".875rem"
                            border="1.5px solid var(--line-200)"
                          />
                          <div className="bz-storefront-review__buyer">{r.buyer}</div>
                          <RatingStars value={r.stars} size={13} />
                        </div>
                        <div className="bz-storefront-review__date">{formatReviewDate(r.time)}</div>
                        <p>{r.text}</p>
                        {r.replied && r.reply && (
                          <div className="bz-storefront-review__reply">
                            <div>{t("store.replyFrom", { name: seller.name })}</div>
                            <p>{r.reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </LocalErrorBoundary>
          )}

          {rating && <RateStoreModal seller={seller} onClose={() => setRating(false)} />}
        </div>
      )}
    </ApiState>
  );
}
