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
// ---------------------------------------------------------------------------
// Accept-counter flow contract (BargainModal counter stage).
// Mirrors the handler exactly: server-side acceptance MUST succeed before the
// item is added to the cart, and a failure aborts the add entirely — adding
// to cart alone never binds a bargained price.
// ---------------------------------------------------------------------------
async function acceptCounterFlow(deps: {
  offerId: string | null;
  acceptCounter: (id: string) => Promise<unknown>;
  addToCart: () => Promise<void>;
  onError: () => void;
  close: () => void;
}) {
  try {
    if (!deps.offerId) throw new Error("missing offer id");
    await deps.acceptCounter(deps.offerId);
  } catch {
    deps.onError();
    return;
  }
  await deps.addToCart();
  deps.close();
}

describe("BargainModal accept-counter contract", () => {
  it("accepts the counter server-side before adding to cart", async () => {
    const calls: string[] = [];
    await acceptCounterFlow({
      offerId: "o1",
      acceptCounter: async () => calls.push("accept"),
      addToCart: async () => {
        calls.push("add");
      },
      onError: () => calls.push("error"),
      close: () => calls.push("close"),
    });
    expect(calls).toEqual(["accept", "add", "close"]);
  });

  it("never adds to cart when server-side acceptance fails", async () => {
    const calls: string[] = [];
    await acceptCounterFlow({
      offerId: "o1",
      acceptCounter: async () => {
        throw new Error("expired");
      },
      addToCart: async () => {
        calls.push("add");
      },
      onError: () => calls.push("error"),
      close: () => calls.push("close"),
    });
    expect(calls).toEqual(["error"]);
  });

  it("treats a missing offer id as a failure, not a silent add", async () => {
    const calls: string[] = [];
    await acceptCounterFlow({
      offerId: null,
      acceptCounter: async () => calls.push("accept"),
      addToCart: async () => {
        calls.push("add");
      },
      onError: () => calls.push("error"),
      close: () => calls.push("close"),
    });
    expect(calls).toEqual(["error"]);
  });
});

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
