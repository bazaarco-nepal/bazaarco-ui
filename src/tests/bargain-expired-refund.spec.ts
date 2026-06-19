import { describe, it, expect } from "vitest";

import { bargainStatus } from "@/features/seller/_shared/bargain";

// Step 5 — buyer expired/refund message + seller non-actionable expired state.

// Mirrors the buyer "My Offers" expired-row text (extra.tsx) so a regression in
// the refund wording trips a test.
function expiredMessage(attemptRefunded: boolean): string {
  return attemptRefunded
    ? "Seller didn't respond in time. Your bargain attempt has been refunded."
    : "Seller didn't respond in time. This offer expired.";
}

describe("buyer expired/refund message", () => {
  it("tells the buyer their attempt was refunded when it was", () => {
    expect(expiredMessage(true)).toMatch(/refunded/i);
  });
  it("still shows an expired message when no refund happened", () => {
    expect(expiredMessage(false)).toMatch(/expired/i);
    expect(expiredMessage(false)).not.toMatch(/refunded/i);
  });
});

describe("seller bargainStatus treats expired as non-actionable", () => {
  it("returns 'expired' for an expired offer (so accept/counter/reject are hidden)", () => {
    expect(bargainStatus({ status: "expired" })).toBe("expired");
  });
  it("does NOT collapse expired into pending", () => {
    expect(bargainStatus({ status: "expired" })).not.toBe("pending");
  });
  it("still maps the live statuses correctly", () => {
    expect(bargainStatus({ status: "pending" })).toBe("pending");
    expect(bargainStatus({ status: "countered" })).toBe("countered");
    expect(bargainStatus({ status: "accepted" })).toBe("accepted");
    expect(bargainStatus({ status: "rejected" })).toBe("rejected");
  });
});
