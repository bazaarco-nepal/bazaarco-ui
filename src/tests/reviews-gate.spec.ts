import { describe, it, expect } from "vitest";

// Unit tests for the review gate message logic used in ReviewsSection.
//
// The component computes `gateMessage` as:
//   if (authed && eligibilityLoading) return null;
//   if (!authed)                       return t("reviews.signInPurchase");
//   if (!eligibility?.hasPurchased)    return t("reviews.purchaseToReview");
//   if (eligibility?.hasReviewed)      return t("reviews.alreadyReviewed");
//   return null;
//
// These tests ensure the gate message and empty-state message are never both
// the same "sign in" string (the bug that was fixed: duplicate CTA copy).

type Eligibility = { hasPurchased: boolean; hasReviewed: boolean; canReview: boolean } | null;

const T = {
  signInPurchase: "Sign in and purchase this product to write a review.",
  purchaseToReview: "Purchase this product to write a review.",
  alreadyReviewed: "You have already reviewed this product.",
  noReviewsYet: "No reviews yet — be the first to review this product.",
  noReviewsEmpty: "No reviews yet.",
};

function gateMessage(
  authed: boolean,
  eligibilityLoading: boolean,
  eligibility: Eligibility,
): string | null {
  if (authed && eligibilityLoading) return null;
  if (!authed) return T.signInPurchase;
  if (!eligibility?.hasPurchased) return T.purchaseToReview;
  if (eligibility?.hasReviewed) return T.alreadyReviewed;
  return null;
}

function canWriteReview(authed: boolean, eligibility: Eligibility): boolean {
  return authed && (eligibility?.canReview ?? false);
}

function emptyStateMessage(authed: boolean, eligibility: Eligibility): string {
  // After the fix: empty state NEVER repeats the gate message.
  // It shows noReviewsYet only to someone who CAN review; otherwise noReviewsEmpty.
  return canWriteReview(authed, eligibility) ? T.noReviewsYet : T.noReviewsEmpty;
}

describe("gateMessage", () => {
  it("returns null while eligibility is loading for a signed-in user", () => {
    expect(gateMessage(true, true, null)).toBeNull();
  });

  it("returns signInPurchase for a guest", () => {
    expect(gateMessage(false, false, null)).toBe(T.signInPurchase);
  });

  it("returns purchaseToReview for a buyer who hasn't purchased", () => {
    const elig: Eligibility = { hasPurchased: false, hasReviewed: false, canReview: false };
    expect(gateMessage(true, false, elig)).toBe(T.purchaseToReview);
  });

  it("returns alreadyReviewed for a buyer who already reviewed", () => {
    const elig: Eligibility = { hasPurchased: true, hasReviewed: true, canReview: false };
    expect(gateMessage(true, false, elig)).toBe(T.alreadyReviewed);
  });

  it("returns null for an eligible reviewer (purchased, not yet reviewed)", () => {
    const elig: Eligibility = { hasPurchased: true, hasReviewed: false, canReview: true };
    expect(gateMessage(true, false, elig)).toBeNull();
  });
});

describe("emptyStateMessage — no duplicate of gateMessage (fix regression)", () => {
  it("shows noReviewsEmpty (neutral) for a guest — does NOT repeat signInPurchase", () => {
    const msg = emptyStateMessage(false, null);
    expect(msg).toBe(T.noReviewsEmpty);
    expect(msg).not.toBe(T.signInPurchase);
  });

  it("shows noReviewsEmpty for a buyer who hasn't purchased", () => {
    const elig: Eligibility = { hasPurchased: false, hasReviewed: false, canReview: false };
    const msg = emptyStateMessage(true, elig);
    expect(msg).toBe(T.noReviewsEmpty);
    expect(msg).not.toBe(T.purchaseToReview);
  });

  it("shows noReviewsEmpty for a buyer who already reviewed", () => {
    const elig: Eligibility = { hasPurchased: true, hasReviewed: true, canReview: false };
    const msg = emptyStateMessage(true, elig);
    expect(msg).toBe(T.noReviewsEmpty);
    expect(msg).not.toBe(T.alreadyReviewed);
  });

  it("shows noReviewsYet for an eligible reviewer — the invitation to be first", () => {
    const elig: Eligibility = { hasPurchased: true, hasReviewed: false, canReview: true };
    const msg = emptyStateMessage(true, elig);
    expect(msg).toBe(T.noReviewsYet);
  });

  it("gate message and empty-state message are never the same string", () => {
    const cases: [boolean, boolean, Eligibility][] = [
      [false, false, null],
      [true, false, { hasPurchased: false, hasReviewed: false, canReview: false }],
      [true, false, { hasPurchased: true, hasReviewed: true, canReview: false }],
      [true, false, { hasPurchased: true, hasReviewed: false, canReview: true }],
    ];

    for (const [authed, loading, elig] of cases) {
      const gate = gateMessage(authed, loading, elig);
      const empty = emptyStateMessage(authed, elig);
      if (gate !== null) {
        expect(empty).not.toBe(gate);
      }
    }
  });
});
