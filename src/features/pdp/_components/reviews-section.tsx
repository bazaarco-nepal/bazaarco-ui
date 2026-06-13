"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Icon, RatingStars } from "@/components/ui";
import { BuyerAvatar, useBz } from "@/components/common";
import {
  useCreateProductReview,
  useProductReviewEligibility,
  useProductReviews,
  useRatingDistribution,
} from "@/hooks/use-catalog";
import { useUploadImage } from "@/hooks/use-media-upload";
import { ApiRequestError } from "@/services/api/http";

const MAX_REVIEW_PHOTOS = 8;

type ReviewSort = "recent" | "highest" | "lowest" | "photos";

// Fixed locale keeps server/client render identical (no hydration drift) and
// matches the "15 Dec 2025" shape buyers expect.
function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const CONTROL_SELECT_STYLE: CSSProperties = {
  appearance: "none",
  background: "#fff",
  border: "1px solid var(--line-200)",
  borderRadius: "var(--r-sm)",
  color: "var(--ink-700)",
  fontFamily: "var(--font-sans)",
  fontSize: ".8125rem",
  fontWeight: 600,
  padding: "6px 26px 6px 10px",
  cursor: "pointer",
};

type Attachment = {
  id: string;
  file: File;
  previewUrl: string;
  url?: string;
  uploading: boolean;
  error?: string;
};

interface ReviewsSectionProps {
  productId: string;
  rating: number;
  reviewCount: number;
}

function ReviewComposer({ productId, onDone }: { productId: string; onDone: () => void }) {
  const { toast, authed, promptLogin } = useBz();
  const createReview = useCreateProductReview(productId);
  const uploadImage = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const shown = hover || stars;
  const anyUploading = attachments.some((a) => a.uploading);
  const canSubmit = stars > 0 && text.trim().length > 0 && !createReview.isPending && !anyUploading;

  const onPickFiles = async (filesList: FileList | null) => {
    if (!filesList) return;
    const files = Array.from(filesList);
    const slots = MAX_REVIEW_PHOTOS - attachments.length;
    if (slots <= 0) {
      toast(`Max ${MAX_REVIEW_PHOTOS} photos.`);
      return;
    }
    const accepted = files.slice(0, slots);
    const newOnes: Attachment[] = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...newOnes]);

    await Promise.all(
      newOnes.map(async (att) => {
        try {
          const result = await uploadImage.mutateAsync({ file: att.file });
          setAttachments((prev) =>
            prev.map((a) => (a.id === att.id ? { ...a, uploading: false, url: result.url } : a)),
          );
        } catch {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === att.id ? { ...a, uploading: false, error: "Upload failed" } : a,
            ),
          );
        }
      }),
    );
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const submit = async () => {
    if (!authed) {
      promptLogin("Please sign in to write a review.");
      return;
    }
    if (!canSubmit) return;
    setError(null);
    const photoUrls = attachments.map((a) => a.url).filter((u): u is string => Boolean(u));
    try {
      await createReview.mutateAsync({
        rating: stars,
        text: text.trim(),
        ...(photoUrls.length ? { photoUrls } : {}),
      });
      toast("Thanks! Your review is posted.");
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      setAttachments([]);
      setStars(0);
      setText("");
      onDone();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        setError("You can only review products you've purchased.");
      } else if (err instanceof ApiRequestError && err.status === 409) {
        setError("You've already reviewed this product.");
      } else {
        toast("Could not post review. Try again.");
      }
    }
  };

  return (
    <div
      style={{
        marginTop: 10,
        padding: 14,
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-md)",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`${s} star${s > 1 ? "s" : ""}`}
            onClick={() => setStars(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
          >
            <Icon
              name="star"
              size={20}
              color={s <= shown ? "var(--gold)" : "var(--line-200)"}
              fill={s <= shown ? "var(--gold)" : "var(--line-200)"}
            />
          </button>
        ))}
        <span style={{ fontSize: ".75rem", color: "var(--ink-400)", marginLeft: 4 }}>
          {stars > 0 ? `${stars}/5` : "Tap to rate"}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Share your experience…"
        style={{
          width: "100%",
          resize: "vertical",
          padding: "10px 12px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--line-200)",
          fontFamily: "var(--font-sans)",
          fontSize: ".875rem",
          color: "var(--ink-900)",
        }}
      />

      {attachments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {attachments.map((a) => (
            <div
              key={a.id}
              style={{
                position: "relative",
                width: 64,
                height: 64,
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
                border: "1px solid var(--line-200)",
                background: "var(--line-100)",
              }}
            >
              <img
                src={a.previewUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  opacity: a.uploading ? 0.5 : 1,
                }}
              />
              {a.uploading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".625rem",
                    color: "var(--ink-700)",
                    fontWeight: 700,
                  }}
                >
                  Uploading…
                </div>
              )}
              {a.error && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(220,38,38,.85)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".625rem",
                    fontWeight: 700,
                    textAlign: "center",
                    padding: 2,
                  }}
                >
                  {a.error}
                </div>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => removeAttachment(a.id)}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(11,18,32,.7)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <div style={{ marginTop: 6, fontSize: ".75rem", color: "var(--red)" }}>{error}</div>
      )}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_REVIEW_PHOTOS}
          className="bz-link-hover"
          style={{
            background: "none",
            border: "none",
            color: attachments.length >= MAX_REVIEW_PHOTOS ? "var(--ink-300)" : "var(--ink-500)",
            fontSize: ".8125rem",
            fontWeight: 600,
            cursor: attachments.length >= MAX_REVIEW_PHOTOS ? "not-allowed" : "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="image" size={14} />
          Add photos
          {attachments.length > 0 ? ` (${attachments.length}/${MAX_REVIEW_PHOTOS})` : ""}
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onDone}
            className="bz-link-hover"
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-400)",
              fontSize: ".8125rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="bz-link-hover"
            style={{
              background: "none",
              border: "none",
              color: canSubmit ? "var(--blue)" : "var(--ink-300)",
              fontSize: ".8125rem",
              fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              padding: 0,
            }}
          >
            {createReview.isPending ? "Posting…" : "Post review"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Customer photos + ratings summary + review list. The ratings summary (average
 * + the five-star distribution) always renders — showing all-zero counts before
 * any rating exists — so buyers see the full breakdown structure even on a fresh
 * product. The photo strip, sort/filter controls, and the list only appear once
 * there are reviews; otherwise a calm "be the first" prompt sits below.
 */
export function ReviewsSection({ productId, rating, reviewCount }: ReviewsSectionProps) {
  const { t } = useTranslation();
  const { authed } = useBz();
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(productId);
  const { data: ratingDist = [], isLoading: ratingLoading } = useRatingDistribution(productId);
  const loading = reviewsLoading || ratingLoading;
  const { data: eligibility, isLoading: eligibilityLoading } = useProductReviewEligibility(
    productId,
    authed,
  );
  const hasReviews = reviewCount > 0;
  const [composerOpen, setComposerOpen] = useState(false);
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Sort/filter run over the already-loaded list — the endpoint returns the
  // full set, so this stays instant and avoids a round-trip per control change.
  const visibleReviews = useMemo(() => {
    const filtered = starFilter ? reviews.filter((r) => r.rating === starFilter) : reviews;
    const ordered = [...filtered];
    if (sort === "highest") ordered.sort((a, b) => b.rating - a.rating);
    else if (sort === "lowest") ordered.sort((a, b) => a.rating - b.rating);
    else if (sort === "photos")
      ordered.sort((a, b) => (b.photoUrls?.length ?? 0) - (a.photoUrls?.length ?? 0));
    return ordered;
  }, [reviews, sort, starFilter]);
  // Always render all five rows — zeros included. The endpoint returns an
  // all-zero set for review-less products; this fallback also covers the load
  // frame so the breakdown never momentarily collapses to nothing.
  const distRows = ratingDist.length
    ? ratingDist
    : [5, 4, 3, 2, 1].map((s) => ({ s, count: 0, pct: 0 }));
  const canWriteReview = authed && (eligibility?.canReview ?? false);
  const gateMessage = (() => {
    if (authed && eligibilityLoading) return null;
    if (!authed) return t("reviews.signInPurchase");
    if (!eligibility?.hasPurchased) return t("reviews.purchaseToReview");
    if (eligibility?.hasReviewed) return t("reviews.alreadyReviewed");
    return null;
  })();

  const openComposer = () => {
    if (!canWriteReview) return;
    setComposerOpen(true);
  };

  return (
    <div>
      {!composerOpen && canWriteReview && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <button
            type="button"
            onClick={openComposer}
            className="bz-link-hover"
            style={{
              background: "none",
              border: "none",
              color: "var(--blue)",
              fontSize: ".8125rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t("reviews.writeReview")}
          </button>
        </div>
      )}

      {!composerOpen && !canWriteReview && gateMessage && (
        <div
          style={{
            fontSize: ".75rem",
            color: "var(--ink-400)",
            textAlign: "right",
            marginBottom: 8,
          }}
        >
          {gateMessage}
        </div>
      )}

      {composerOpen && canWriteReview && (
        <ReviewComposer productId={productId} onDone={() => setComposerOpen(false)} />
      )}

      {hasReviews && reviews.some((r) => r.photoUrls && r.photoUrls.length > 0) && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: ".8125rem",
              fontWeight: 700,
              color: "var(--ink-500)",
              marginBottom: 8,
            }}
          >
            Real photos from buyers
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {reviews.flatMap((r, ri) =>
              (r.photoUrls ?? []).map((url, j) => (
                <div
                  key={`${ri}-${j}`}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                    border: "1px solid var(--line-200)",
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )),
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 24,
          padding: 18,
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
        }}
      >
        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 120 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
            <span
              className="tnum bz-hero-h2"
              style={{ fontWeight: 800, color: "var(--blue-deep)", lineHeight: 1 }}
            >
              {rating.toFixed(1)}
            </span>
            <span
              className="tnum"
              style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink-400)" }}
            >
              /5
            </span>
          </div>
          <div style={{ marginTop: 6 }}>
            <RatingStars value={rating} size={16} />
          </div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
            {reviewCount} {t("reviews.ratings")}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          {distRows.map((r) => (
            <button
              key={r.s}
              type="button"
              disabled={!hasReviews}
              aria-pressed={starFilter === r.s}
              onClick={() => setStarFilter((cur) => (cur === r.s ? null : r.s))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 5,
                width: "100%",
                background: "none",
                border: "none",
                padding: "2px 0",
                cursor: hasReviews ? "pointer" : "default",
                opacity: starFilter && starFilter !== r.s ? 0.45 : 1,
              }}
            >
              <span
                className="tnum"
                style={{ fontSize: ".75rem", color: "var(--ink-400)", width: 10 }}
              >
                {r.s}
              </span>
              <Icon name="star" size={11} color="var(--gold)" fill="var(--gold)" />
              <div
                style={{
                  flex: 1,
                  maxWidth: 200,
                  height: 6,
                  background: "var(--line-100)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: `${r.pct}%`, height: "100%", background: "var(--gold)" }} />
              </div>
              <span
                className="tnum"
                style={{ fontSize: ".75rem", color: "var(--ink-500)", minWidth: 16 }}
              >
                {r.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {hasReviews ? (
        <>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 12,
              borderBottom: "1px solid var(--line-200)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              {t("reviews.productReviews")}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--ink-400)" }}>
                  {t("reviews.sort")}
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as ReviewSort)}
                  style={CONTROL_SELECT_STYLE}
                >
                  <option value="recent">{t("reviews.sortRecent")}</option>
                  <option value="highest">{t("reviews.sortHighest")}</option>
                  <option value="lowest">{t("reviews.sortLowest")}</option>
                  <option value="photos">{t("reviews.sortPhotos")}</option>
                </select>
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--ink-400)" }}>
                  {t("reviews.filter")}
                </span>
                <select
                  value={starFilter ?? "all"}
                  onChange={(e) =>
                    setStarFilter(e.target.value === "all" ? null : Number(e.target.value))
                  }
                  style={CONTROL_SELECT_STYLE}
                >
                  <option value="all">{t("reviews.allStars")}</option>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>
                      {s}★
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {visibleReviews.length === 0 ? (
            <div
              style={{
                marginTop: 16,
                fontSize: ".875rem",
                color: "var(--ink-400)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              {t("reviews.noMatch")}
            </div>
          ) : (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {visibleReviews.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    paddingBottom: 14,
                    borderBottom:
                      i < visibleReviews.length - 1 ? "1px solid var(--line-200)" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <RatingStars value={r.rating} size={13} />
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: ".75rem",
                        color: "var(--ink-400)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatReviewDate(r.date)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <BuyerAvatar
                      src={r.avatar}
                      name={r.name}
                      size={34}
                      fontSize=".875rem"
                      border="1.5px solid var(--line-200)"
                    />
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 700,
                          fontSize: ".875rem",
                        }}
                      >
                        {r.name}
                        {r.verified && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: ".6875rem",
                              fontWeight: 700,
                              color: "var(--success)",
                            }}
                          >
                            <Icon name="shieldCheck" size={13} color="var(--success)" />
                            {t("reviews.verifiedPurchase")}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>{r.city}</div>
                    </div>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--ink-600)",
                      fontSize: ".875rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {r.text}
                  </p>
                  {r.photoUrls && r.photoUrls.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      {r.photoUrls.map((url, j) => (
                        <div
                          key={j}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "var(--r-sm)",
                            overflow: "hidden",
                            border: "1px solid var(--line-200)",
                          }}
                        >
                          <img
                            src={url}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        !loading &&
        !composerOpen && (
          <div style={{ marginTop: 14, fontSize: ".9375rem", color: "var(--ink-500)" }}>
            {canWriteReview ? t("reviews.noReviewsYet") : t("reviews.noReviewsEmpty")}
          </div>
        )
      )}
    </div>
  );
}
