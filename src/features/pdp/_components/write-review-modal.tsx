"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { useBz } from "@/components/common";
import { useCreateProductReview } from "@/hooks/use-catalog";
import { ApiRequestError } from "@/services/api/http";

const RATING_LABELS = ["", "Bad", "Not great", "Okay", "Good", "Excellent"];

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

/**
 * Buyer review composer. Posts to the verified-purchase-gated endpoint; a 403
 * (didn't buy) surfaces a calm inline message rather than a hard failure.
 */
export function WriteReviewModal({ productId, productName, onClose }: WriteReviewModalProps) {
  const { toast } = useBz();
  const createReview = useCreateProductReview(productId);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const shown = hover || stars;
  const canSubmit = stars > 0 && text.trim().length > 0 && !createReview.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await createReview.mutateAsync({ rating: stars, text: text.trim() });
      toast("Thanks! Your review is posted.");
      onClose();
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
            Write a review
          </h2>
          <button
            type="button"
            aria-label="Close"
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
          How was {productName}? Your review helps other shoppers in Nepal.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`${s} star${s > 1 ? "s" : ""}`}
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
          {RATING_LABELS[shown]}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Share your experience with this product…"
          style={{
            width: "100%",
            resize: "vertical",
            padding: "12px 14px",
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--line-200)",
            fontFamily: "var(--font-sans)",
            fontSize: ".9375rem",
            color: "var(--ink-900)",
            marginBottom: error ? 8 : 18,
          }}
        />

        {error && (
          <div style={{ marginBottom: 14, fontSize: ".8125rem", color: "var(--red)" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="star"
            disabled={!canSubmit}
            loading={createReview.isPending}
            onClick={() => void submit()}
          >
            Post review
          </Button>
        </div>
      </div>
    </div>
  );
}
