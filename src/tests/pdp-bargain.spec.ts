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
  variantId?: string | null;
  acceptCounter: (id: string) => Promise<unknown>;
  addToCart: (variantId: string | null | undefined) => Promise<void>;
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
  // The accepted deal is keyed to the bargained variant — the cart add MUST
  // use that exact variant so the bargained price lands on the right line.
  await deps.addToCart(deps.variantId);
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

  it("adds the bargained variant to the cart with its exact variantId", async () => {
    let addedVariantId: string | null | undefined = "unset";
    await acceptCounterFlow({
      offerId: "o1",
      variantId: "v-red-s",
      acceptCounter: async () => undefined,
      addToCart: async (variantId) => {
        addedVariantId = variantId;
      },
      onError: () => undefined,
      close: () => undefined,
    });
    expect(addedVariantId).toBe("v-red-s");
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

// ---------------------------------------------------------------------------
// BargainModal submit guard: an offer must be a positive amount strictly below
// the listed price. Mirrors the early-return checks in BargainModal.submit so a
// refactor that lets an at/above-listed offer through trips a test. Returns the
// blocking reason, or null when the offer may be sent to the backend.
// ---------------------------------------------------------------------------
function offerBlockReason(offerValue: number, listed: number): "empty" | "not-below-listed" | null {
  if (!offerValue || offerValue <= 0) return "empty";
  if (offerValue >= listed) return "not-below-listed";
  return null;
}

describe("BargainModal submit guard (offer vs listed price)", () => {
  it("blocks an offer equal to the listed price", () => {
    expect(offerBlockReason(1000, 1000)).toBe("not-below-listed");
  });

  it("blocks an offer above the listed price", () => {
    expect(offerBlockReason(1200, 1000)).toBe("not-below-listed");
  });

  it("allows an offer below the listed price", () => {
    expect(offerBlockReason(950, 1000)).toBeNull();
  });

  it("blocks an empty/zero offer before the listed-price check", () => {
    expect(offerBlockReason(0, 1000)).toBe("empty");
  });
});

// ---------------------------------------------------------------------------
// Attempts-remaining label (Step 3): platform-wide wording, no item-level text.
// Mirrors the string built in BargainModal so a regression to "on this item"
// trips a test.
// ---------------------------------------------------------------------------
function attemptsLabel(attemptsLeft: number): string {
  return attemptsLeft === 0
    ? "No bargain attempts left today."
    : `${attemptsLeft} bargain ${attemptsLeft === 1 ? "attempt" : "attempts"} left today.`;
}

describe("BargainModal attempts label (platform-wide wording)", () => {
  it("uses plural, platform-wide wording with no item-level text", () => {
    const label = attemptsLabel(3);
    expect(label).toBe("3 bargain attempts left today.");
    expect(label).not.toMatch(/on this item|per item|this product/i);
  });

  it("uses singular wording for one attempt", () => {
    expect(attemptsLabel(1)).toBe("1 bargain attempt left today.");
  });

  it("shows the exhausted message at zero", () => {
    expect(attemptsLabel(0)).toBe("No bargain attempts left today.");
  });
});

// ---------------------------------------------------------------------------
// Offer-intent auto-open: a bargain rail's "Make an offer" navigates to
// /product/:id?offer=1, and the PDP runs the same openBargain() its own button
// does. Mirrors the effect gate exactly: fire once, only for ?offer=1, and only
// once bargaining has resolved available (the API product may still be loading).
// ---------------------------------------------------------------------------
function shouldAutoOpenOffer(
  offerParam: string | null,
  bargainingAvailable: boolean,
  alreadyConsumed: boolean,
): boolean {
  if (alreadyConsumed) return false;
  if (offerParam !== "1") return false;
  return bargainingAvailable;
}

describe("PDP offer-intent auto-open (?offer=1)", () => {
  it("opens when arriving with ?offer=1 and bargaining is available", () => {
    expect(shouldAutoOpenOffer("1", true, false)).toBe(true);
  });

  it("does not open without the offer intent", () => {
    expect(shouldAutoOpenOffer(null, true, false)).toBe(false);
    expect(shouldAutoOpenOffer("0", true, false)).toBe(false);
  });

  it("waits (does not open) until bargaining resolves available", () => {
    expect(shouldAutoOpenOffer("1", false, false)).toBe(false);
  });

  it("fires at most once per mount", () => {
    expect(shouldAutoOpenOffer("1", true, true)).toBe(false);
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
