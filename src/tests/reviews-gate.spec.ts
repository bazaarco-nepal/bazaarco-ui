import { describe, it, expect } from "vitest";

// Unit tests for the review gate message logic used in ReviewsSection.
//
// The component computes `gateMessage` as:
//   if (authed && eligibilityLoading) return null;
//   if (!authed)                       return t("reviews.signInPurchase");
//   if (!eligibility?.hasPurchased)    return t("reviews.purchaseToReview");
//   if (!eligibility?.hasDelivered)    return t("reviews.availableAfterDelivery");
//   if (eligibility?.hasReviewed)      return t("reviews.alreadyReviewed");
//   return null;
//
// A product review is only allowed once the order is DELIVERED (anti-fake-review
// gate). These tests cover the delivery gate and ensure the gate message and the
// empty-state message are never the same string.

type Eligibility = {
  hasPurchased: boolean;
  hasDelivered: boolean;
  hasReviewed: boolean;
  canReview: boolean;
} | null;

const T = {
  signInPurchase: "Sign in and purchase this product to write a review.",
  purchaseToReview: "Purchase this product to write a review.",
  availableAfterDelivery: "Available after delivery.",
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
  if (!eligibility?.hasDelivered) return T.availableAfterDelivery;
  if (eligibility?.hasReviewed) return T.alreadyReviewed;
  return null;
}

function canWriteReview(authed: boolean, eligibility: Eligibility): boolean {
  return authed && (eligibility?.canReview ?? false);
}

function showWriteReviewButton(authed: boolean, eligibility: Eligibility): boolean {
  return canWriteReview(authed, eligibility);
}

function showGateMessage(
  authed: boolean,
  eligibilityLoading: boolean,
  eligibility: Eligibility,
): boolean {
  return (
    !showWriteReviewButton(authed, eligibility) &&
    gateMessage(authed, eligibilityLoading, eligibility) !== null
  );
}

function emptyStateMessage(authed: boolean, eligibility: Eligibility): string {
  // After the fix: empty state NEVER repeats the gate message.
  // It shows noReviewsYet only to someone who CAN review; otherwise noReviewsEmpty.
  return canWriteReview(authed, eligibility) ? T.noReviewsYet : T.noReviewsEmpty;
}

const elig = (over: Partial<NonNullable<Eligibility>>): Eligibility => ({
  hasPurchased: false,
  hasDelivered: false,
  hasReviewed: false,
  canReview: false,
  ...over,
});

describe("gateMessage", () => {
  it("returns null while eligibility is loading for a signed-in user", () => {
    expect(gateMessage(true, true, null)).toBeNull();
  });

  it("returns signInPurchase for a guest", () => {
    expect(gateMessage(false, false, null)).toBe(T.signInPurchase);
  });

  it("returns purchaseToReview for a buyer who hasn't purchased", () => {
    expect(gateMessage(true, false, elig({}))).toBe(T.purchaseToReview);
  });

  it("returns availableAfterDelivery for a buyer who ordered but isn't delivered yet", () => {
    expect(gateMessage(true, false, elig({ hasPurchased: true }))).toBe(T.availableAfterDelivery);
  });

  it("returns alreadyReviewed for a delivered buyer who already reviewed", () => {
    expect(
      gateMessage(true, false, elig({ hasPurchased: true, hasDelivered: true, hasReviewed: true })),
    ).toBe(T.alreadyReviewed);
  });

  it("returns null for an eligible reviewer (delivered, not yet reviewed)", () => {
    expect(
      gateMessage(true, false, elig({ hasPurchased: true, hasDelivered: true, canReview: true })),
    ).toBeNull();
  });
});

describe("write review CTA visibility", () => {
  it("shows the button only when the buyer can review (delivered + not reviewed)", () => {
    expect(showWriteReviewButton(false, null)).toBe(false);
    expect(showWriteReviewButton(true, elig({ hasPurchased: true }))).toBe(false);
    expect(
      showWriteReviewButton(
        true,
        elig({ hasPurchased: true, hasDelivered: true, hasReviewed: true }),
      ),
    ).toBe(false);
    expect(
      showWriteReviewButton(
        true,
        elig({ hasPurchased: true, hasDelivered: true, canReview: true }),
      ),
    ).toBe(true);
  });

  it("never shows the active button and gate message together", () => {
    const cases: [boolean, boolean, Eligibility][] = [
      [false, false, null],
      [true, false, elig({})],
      [true, false, elig({ hasPurchased: true })],
      [true, false, elig({ hasPurchased: true, hasDelivered: true, hasReviewed: true })],
      [true, false, elig({ hasPurchased: true, hasDelivered: true, canReview: true })],
      [true, true, null],
    ];

    for (const [authed, loading, e] of cases) {
      const button = showWriteReviewButton(authed, e);
      const gate = showGateMessage(authed, loading, e);
      expect(button && gate).toBe(false);
    }
  });
});

describe("emptyStateMessage — never duplicates the gate message", () => {
  it("shows noReviewsEmpty for an ordered-but-undelivered buyer (not availableAfterDelivery)", () => {
    const msg = emptyStateMessage(true, elig({ hasPurchased: true }));
    expect(msg).toBe(T.noReviewsEmpty);
    expect(msg).not.toBe(T.availableAfterDelivery);
  });

  it("shows noReviewsYet for an eligible reviewer", () => {
    const msg = emptyStateMessage(
      true,
      elig({ hasPurchased: true, hasDelivered: true, canReview: true }),
    );
    expect(msg).toBe(T.noReviewsYet);
  });
});
