"use client";

import { Button, Icon, Placeholder, RatingStars } from "@/components/ui";
import type { ProductReview, RatingDistribution, Tint } from "@/types";

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
  icon: string;
  tint: Tint;
  reviews: ProductReview[];
  ratingDist: RatingDistribution[];
  loading: boolean;
  onWriteReview: () => void;
}

/**
 * Customer photos + ratings summary + review list. When the product has no
 * reviews, collapses to a calm "be the first" prompt — no fake distribution
 * bars, no "0 reviews" (matches the home hide-when-empty approach).
 */
export function ReviewsSection({
  rating,
  reviewCount,
  icon,
  tint,
  reviews,
  ratingDist,
  loading,
  onWriteReview,
}: ReviewsSectionProps) {
  const hasReviews = reviewCount > 0;

  return (
    <div>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 14 }}>
        Customer photos &amp; reviews
      </h3>

      {!loading && !hasReviews ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: "28px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: ".9375rem", color: "var(--ink-500)", marginBottom: 14 }}>
            No reviews yet — be the first to review this product.
          </div>
          <Button variant="secondary" icon="star" onClick={onWriteReview}>
            Write a review
          </Button>
        </div>
      ) : (
        <>
          {reviews.some((r) => r.photos > 0) && (
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
                  Array.from({ length: r.photos }).map((_, j) => (
                    <Placeholder
                      key={`${ri}-${j}`}
                      icon={icon}
                      tint={(["slate", "gold", "blue", tint] as Tint[])[(ri + j) % 4]}
                      style={{ width: 80, height: 80 }}
                      radius="var(--r-sm)"
                    />
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
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "1.5px solid var(--line-200)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={r.avatar}
                      alt={r.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
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

          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" full icon="star" onClick={onWriteReview}>
              Write a review
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
