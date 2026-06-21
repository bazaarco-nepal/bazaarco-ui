"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Button,
  RatingStars,
  Chip,
  EmptyState,
  ApiState,
  SkeletonCard,
  StoreAvatar,
  AppLink,
} from "@/components/ui";
import { toast } from "@/lib/toast";
import { BuyerAvatar, ProductCard, useBz } from "@/components/common";
import {
  useSeller,
  useSellerReviews,
  useSellerProducts,
  useCreateSellerReview,
} from "@/hooks/use-catalog";
import { storeIdFromPath, pathFromScreen } from "@/config/routes";
import { formatStoreAddress } from "@/lib/store-address";
import type { Seller } from "@/types";

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
  const storeId = storeIdFromPath(pathname);
  const { openProduct, nav, authed, promptLogin } = useBz();

  const sellerQuery = useSeller(storeId);
  const reviewsQuery = useSellerReviews(storeId);
  const productsQuery = useSellerProducts(storeId);

  const seller = sellerQuery.data;
  const reviews = reviewsQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const isLoading = sellerQuery.isLoading || reviewsQuery.isLoading || productsQuery.isLoading;
  const isError = sellerQuery.isError;
  const error = sellerQuery.error;

  const [tab, setTab] = useState<"products" | "reviews">("products");
  const [rating, setRating] = useState(false);

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
        <div
          className="bz-store-page"
          style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 0" }}
        >
          {/* breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: ".8125rem",
              color: "var(--ink-400)",
              marginBottom: 18,
            }}
          >
            <AppLink href={pathFromScreen("home")} className="bz-crumb">
              {t("common.home")}
            </AppLink>
            <Icon name="chevronRight" size={13} color="var(--ink-300)" />
            <span style={{ color: "var(--ink-700)" }}>{seller.name}</span>
          </div>

          {/* store header */}
          <div
            className="bz-store-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "20px 24px",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--line-200)",
              background: "var(--card)",
              boxShadow: "var(--sh-1)",
              marginBottom: 22,
            }}
          >
            <StoreAvatar src={seller.avatar} name={seller.name} size={72} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "var(--ink-900)",
                    letterSpacing: "-.01em",
                  }}
                >
                  {seller.name}
                </h1>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <Chip tone="neutral" icon="mapPin">
                  {formatStoreAddress(seller.storeAddress, seller.city) || seller.city}
                </Chip>
                <span
                  aria-hidden
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--line-200)",
                  }}
                />
                {seller.rating > 0 ? (
                  <RatingStars value={seller.rating} size={15} showVal count={seller.reviews} />
                ) : (
                  <span style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
                    {t("store.noRatings")}
                  </span>
                )}
              </div>
            </div>
            <div
              className="bz-store-actions"
              style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}
            >
              <Button variant="primary" size="sm" icon="messageDots" onClick={openChat}>
                {t("store.chatWithSeller")}
              </Button>
              <Button variant="secondary" size="sm" icon="star" onClick={openRate}>
                {t("store.rateStore")}
              </Button>
            </div>
          </div>

          {/* tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 22,
              borderBottom: "1px solid var(--line-200)",
              paddingBottom: 16,
            }}
          >
            {(
              [
                {
                  id: "products",
                  label: t("store.tabProducts"),
                  icon: "store",
                  count: products.length,
                },
                {
                  id: "reviews",
                  label: t("store.tabReviews"),
                  icon: "star",
                  count: reviews.length,
                },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 16px",
                    borderRadius: "var(--r-md)",
                    border: `1.5px solid ${active ? "var(--blue)" : "var(--line-200)"}`,
                    background: active ? "var(--tint-blue-50)" : "#fff",
                    color: active ? "var(--blue)" : "var(--ink-500)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: ".875rem",
                    cursor: "pointer",
                    transition:
                      "background var(--dur-standard) var(--ease), border-color var(--dur-standard) var(--ease), color var(--dur-standard) var(--ease)",
                  }}
                >
                  <Icon name={t.icon} size={16} />
                  {t.label}
                  <span
                    className="tnum"
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: "var(--r-full)",
                      background: active ? "var(--blue)" : "var(--line-100)",
                      color: active ? "#fff" : "var(--ink-400)",
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* products */}
          {tab === "products" && (
            <div style={{ marginBottom: 40 }}>
              {products.length === 0 ? (
                <EmptyState
                  title={t("store.noProductsTitle")}
                  message={t("store.noProductsMessage")}
                />
              ) : (
                <div
                  className="bz-grid-cards"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 18,
                  }}
                >
                  {products.map((p) => (
                    <ProductCard key={p.id} p={p} onClick={openProduct} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* reviews */}
          {tab === "reviews" && (
            <div style={{ marginBottom: 40 }}>
              {reviews.length === 0 ? (
                <EmptyState
                  title={t("store.noReviewsTitle")}
                  message={t("store.noReviewsMessage")}
                  cta={t("reviews.writeReview")}
                  onCta={openRate}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "16px 18px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--line-200)",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <BuyerAvatar
                          src={r.avatar}
                          name={r.buyer}
                          size={34}
                          fontSize=".875rem"
                          border="1.5px solid var(--line-200)"
                        />
                        <div style={{ fontWeight: 700, fontSize: ".9375rem" }}>{r.buyer}</div>
                        <div style={{ marginLeft: "auto" }}>
                          <RatingStars value={r.stars} size={13} />
                        </div>
                      </div>
                      <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginBottom: 8 }}>
                        {formatReviewDate(r.time)}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "var(--ink-700)",
                          fontSize: ".875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {r.text}
                      </p>
                      {r.replied && r.reply && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: "10px 14px",
                            borderRadius: "var(--r-sm)",
                            background: "var(--line-100)",
                            borderLeft: "3px solid var(--blue)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: ".75rem",
                              fontWeight: 700,
                              color: "var(--ink-500)",
                              marginBottom: 3,
                            }}
                          >
                            {t("store.replyFrom", { name: seller.name })}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: ".8125rem",
                              color: "var(--ink-700)",
                              lineHeight: 1.55,
                            }}
                          >
                            {r.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rating && <RateStoreModal seller={seller} onClose={() => setRating(false)} />}
        </div>
      )}
    </ApiState>
  );
}
