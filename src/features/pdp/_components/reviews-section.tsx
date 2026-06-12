"use client";

import { useRef, useState } from "react";
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
 * Customer photos + ratings summary + review list. When the product has no
 * reviews, collapses to a calm "be the first" prompt — no fake distribution
 * bars, no "0 reviews" (matches the home hide-when-empty approach).
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
  const canWriteReview = authed && (eligibility?.canReview ?? false);
  const writeLocked = !canWriteReview;
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
      {!composerOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            marginBottom: 8,
            opacity: writeLocked ? 0.55 : 1,
          }}
        >
          <button
            type="button"
            onClick={openComposer}
            disabled={writeLocked}
            aria-disabled={writeLocked}
            className="bz-link-hover"
            style={{
              background: "none",
              border: "none",
              color: writeLocked ? "var(--ink-400)" : "var(--blue)",
              fontSize: ".8125rem",
              fontWeight: 700,
              cursor: writeLocked ? "not-allowed" : "pointer",
              padding: 0,
            }}
          >
            {t("reviews.writeReview")}
          </button>
          {gateMessage && (
            <div style={{ fontSize: ".75rem", color: "var(--ink-400)", textAlign: "right" }}>
              {gateMessage}
            </div>
          )}
        </div>
      )}

      {composerOpen && canWriteReview && (
        <ReviewComposer productId={productId} onDone={() => setComposerOpen(false)} />
      )}

      {!loading && !hasReviews ? (
        !composerOpen && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: "28px 20px",
              textAlign: "center",
              opacity: writeLocked ? 0.55 : 1,
            }}
          >
            <div style={{ fontSize: ".9375rem", color: "var(--ink-500)" }}>
              {canWriteReview ? t("reviews.noReviewsYet") : t("reviews.noReviewsEmpty")}
            </div>
          </div>
        )
      ) : (
        <>
          {reviews.some((r) => r.photoUrls && r.photoUrls.length > 0) && (
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
              gap: 24,
              padding: 18,
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
            }}
          >
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div
                className="tnum bz-hero-h2"
                style={{ fontWeight: 800, color: "var(--blue-deep)", lineHeight: 1 }}
              >
                {rating.toFixed(1)}
              </div>
              <RatingStars value={rating} size={14} />
              <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 4 }}>
                {reviewCount} reviews
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {ratingDist.map((r) => (
                <div
                  key={r.s}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}
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
                      height: 6,
                      background: "var(--line-100)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{ width: `${r.pct}%`, height: "100%", background: "var(--gold)" }}
                    />
                  </div>
                  <span
                    className="tnum"
                    style={{
                      fontSize: ".75rem",
                      color: "var(--ink-400)",
                      width: 28,
                      textAlign: "right",
                    }}
                  >
                    {r.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {reviews.map((r, i) => (
              <div
                key={i}
                style={{
                  paddingBottom: 14,
                  borderBottom: i < reviews.length - 1 ? "1px solid var(--line-200)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <BuyerAvatar
                    src={r.avatar}
                    name={r.name}
                    size={34}
                    fontSize=".875rem"
                    border="1.5px solid var(--line-200)"
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".875rem" }}>{r.name}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
                      {r.city} · {r.date}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <RatingStars value={r.rating} size={12} />
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
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
        </>
      )}
    </div>
  );
}
