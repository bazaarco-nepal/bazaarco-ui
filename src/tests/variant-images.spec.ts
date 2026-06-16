import { describe, it, expect } from "vitest";
import { optionImageFor, variantSwatchImage, selectionHeroImage } from "@/lib/variant-images";
import type { OptionImage, PricedVariant } from "@/types/catalog";

// Mirrors the server's resolution chain (bazaarco-api catalog.service
// `resolveVariantImage`): exact per-variant image → option-level image → cover.
// These cover the "image by colour" (option mode) listing a buyer interacts with
// on the PDP — the t-shirt with one Red photo and one Blue photo, no per-SKU image.

const optionImages: OptionImage[] = [
  { optionName: "Color", optionValue: "Red", imageUrl: "/red.jpg" },
  { optionName: "Color", optionValue: "Blue", imageUrl: "/blue.jpg" },
];

const variant = (over: Partial<PricedVariant>): PricedVariant => ({
  id: "v",
  name: "v",
  price: 100,
  stock: 5,
  ...over,
});

describe("optionImageFor", () => {
  it("finds the image for an attribute value", () => {
    expect(optionImageFor(optionImages, "Color", "Red")).toBe("/red.jpg");
    expect(optionImageFor(optionImages, "Color", "Blue")).toBe("/blue.jpg");
  });

  it("matches case-insensitively, like the server", () => {
    expect(optionImageFor(optionImages, "color", "red")).toBe("/red.jpg");
  });

  it("returns null when there is no match or no option images", () => {
    expect(optionImageFor(optionImages, "Color", "Green")).toBeNull();
    expect(optionImageFor(undefined, "Color", "Red")).toBeNull();
  });
});

describe("variantSwatchImage", () => {
  it("prefers the variant's own exact image", () => {
    const v = variant({ imageUrl: "/exact.jpg", optionValues: { Color: "Red" } });
    expect(variantSwatchImage(v, optionImages)).toBe("/exact.jpg");
  });

  it("falls back to the option image when the variant has no image (option mode)", () => {
    const v = variant({ imageUrl: null, optionValues: { Color: "Blue" } });
    expect(variantSwatchImage(v, optionImages)).toBe("/blue.jpg");
  });

  it("never invents a cover image — returns null when nothing distinct exists", () => {
    const v = variant({ imageUrl: null, optionValues: { Size: "M" } });
    expect(variantSwatchImage(v, optionImages)).toBeNull();
  });
});

describe("selectionHeroImage", () => {
  it("uses the server-resolved image of the selected variant", () => {
    const v = variant({ imageUrl: null, resolvedImageUrl: "/red.jpg" });
    expect(selectionHeroImage(v, {}, optionImages)).toBe("/red.jpg");
  });

  it("falls back to the variant's exact image when no resolved image is present", () => {
    const v = variant({ imageUrl: "/exact.jpg", resolvedImageUrl: null });
    expect(selectionHeroImage(v, {}, optionImages)).toBe("/exact.jpg");
  });

  it("features a picked option's image when no single variant is resolved yet", () => {
    // e.g. Colour×Size product, only the colour chosen so far.
    expect(selectionHeroImage(null, { Color: "Blue" }, optionImages)).toBe("/blue.jpg");
  });

  it("returns null when nothing is selected and no option drives an image", () => {
    expect(selectionHeroImage(null, {}, optionImages)).toBeNull();
    expect(selectionHeroImage(null, { Size: "M" }, optionImages)).toBeNull();
  });
});
