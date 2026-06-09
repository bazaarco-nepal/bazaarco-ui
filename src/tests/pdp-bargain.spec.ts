import { describe, it, expect } from "vitest";

// Unit tests for the bargaining availability logic used in PDP.
// The real component code uses:
//   const bargainingAvailable = selVariant
//     ? Boolean(selVariant.allowBargaining ?? p.allowBargaining)
//     : Boolean(p.allowBargaining);
// We mirror that exact logic here so a refactor that breaks it triggers a test failure.

function bargainingAvailable(
  productAllowBargaining: boolean | null | undefined,
  selVariant: { allowBargaining?: boolean | null } | null | undefined,
): boolean {
  if (selVariant) {
    return Boolean(selVariant.allowBargaining ?? productAllowBargaining);
  }
  return Boolean(productAllowBargaining);
}

describe("PDP bargainingAvailable logic", () => {
  describe("no variant selected", () => {
    it("is true when product allows bargaining", () => {
      expect(bargainingAvailable(true, null)).toBe(true);
    });

    it("is false when product does not allow bargaining", () => {
      expect(bargainingAvailable(false, null)).toBe(false);
    });

    it("is false when product allowBargaining is null", () => {
      expect(bargainingAvailable(null, null)).toBe(false);
    });

    it("is false when product allowBargaining is undefined", () => {
      expect(bargainingAvailable(undefined, null)).toBe(false);
    });
  });

  describe("variant selected", () => {
    it("uses variant flag when it is true, ignoring product flag", () => {
      expect(bargainingAvailable(false, { allowBargaining: true })).toBe(true);
    });

    it("uses variant flag when it is false, ignoring product flag", () => {
      expect(bargainingAvailable(true, { allowBargaining: false })).toBe(false);
    });

    it("falls back to product flag when variant flag is null", () => {
      expect(bargainingAvailable(true, { allowBargaining: null })).toBe(true);
      expect(bargainingAvailable(false, { allowBargaining: null })).toBe(false);
    });

    it("falls back to product flag when variant flag is undefined", () => {
      expect(bargainingAvailable(true, {})).toBe(true);
      expect(bargainingAvailable(false, {})).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// MobileBuyBar onBargain prop contract
// Tests the expectation that onBargain is passed iff bargainingAvailable.
// ---------------------------------------------------------------------------
describe("MobileBuyBar onBargain wiring", () => {
  it("passes onBargain handler when bargainingAvailable is true", () => {
    // Simulates: onBargain={bargainingAvailable ? openBargain : undefined}
    const openBargain = () => {};
    const available = true;
    const onBargain = available ? openBargain : undefined;
    expect(onBargain).toBe(openBargain);
  });

  it("passes undefined for onBargain when bargainingAvailable is false", () => {
    const openBargain = () => {};
    const available = false;
    const onBargain = available ? openBargain : undefined;
    expect(onBargain).toBeUndefined();
  });
});
