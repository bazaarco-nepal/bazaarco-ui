import { describe, it, expect } from "vitest";
import {
  ADD_PRODUCT_DRAFT_KEY,
  productDraftHasContent,
  type ProductDraftPreview,
} from "@/features/seller/_shared/form-workflow";

// REGRESSION: a seller's "Save draft" on Add Product wrote the draft to
// localStorage but NOTHING ever read it back — the draft was unreachable. The
// fix surfaces the saved draft as a "Continue" card in Inventory and resumes it
// in the Add Product form. Both surfaces share one key and one gating predicate
// (`productDraftHasContent`) so they can never disagree about whether a draft
// exists. These tests pin that shared contract.

describe("Add Product draft — shared key", () => {
  it("uses the same localStorage key both screens read/write", () => {
    // Drift here is exactly the bug that made the draft unreachable.
    expect(ADD_PRODUCT_DRAFT_KEY).toBe("bz-draft-add-product");
  });
});

describe("productDraftHasContent — gates whether a draft is surfaced/resumed", () => {
  it("treats null / undefined as no draft", () => {
    expect(productDraftHasContent(null)).toBe(false);
    expect(productDraftHasContent(undefined)).toBe(false);
  });

  it("ignores an all-empty draft (a stray focus shouldn't leave a ghost)", () => {
    const empty: ProductDraftPreview = {
      title: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      hasVariants: false,
      brand: "",
      keywords: "",
    };
    expect(productDraftHasContent(empty)).toBe(false);
  });

  it("ignores whitespace-only text fields", () => {
    expect(productDraftHasContent({ title: "   " })).toBe(false);
    expect(productDraftHasContent({ brand: "\t" })).toBe(false);
  });

  it.each([
    ["title", { title: "Handwoven dhaka topi" }],
    ["description", { description: "A traditional Nepali cap." }],
    ["category", { category: "apparel" }],
    ["price", { price: "1200" }],
    ["stock", { stock: "5" }],
    ["hasVariants", { hasVariants: true }],
    ["brand", { brand: "Local Co" }],
    ["keywords", { keywords: "topi, dhaka" }],
  ] as Array<[string, ProductDraftPreview]>)(
    "surfaces a draft once %s carries real content",
    (_field, draft) => {
      expect(productDraftHasContent(draft)).toBe(true);
    },
  );
});
