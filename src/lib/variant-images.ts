/**
 * Variant image resolution for the buyer PDP, mirroring the server's chain
 * (exact per-variant image → option-level image → product cover → gallery).
 *
 * Sellers list variant photos in one of three modes: a shared product image, one
 * image per option value (e.g. one for Color "Red"), or an exact image per SKU.
 * Option-mode images live in `product.optionImages`, not on the SKU, so a variant's
 * own `imageUrl` is empty and the photo must be resolved through them. These helpers
 * are the single source of truth the picker swatches and the hero image both read.
 */

import type { OptionImage, PricedVariant } from "@/types/catalog";

/** Option-level image for an attribute value (e.g. Color "Red"), case-insensitive. */
export function optionImageFor(
  optionImages: OptionImage[] | undefined,
  name: string,
  value: string,
): string | null {
  return (
    optionImages?.find(
      (o) =>
        o.optionName.toLowerCase() === name.toLowerCase() &&
        o.optionValue.toLowerCase() === value.toLowerCase(),
    )?.imageUrl ?? null
  );
}

/**
 * A variant's swatch photo for the picker: its exact per-variant image, else the
 * option image for one of its option values. Never the product cover — a shared
 * cover would make every swatch look identical and defeat the picker.
 */
export function variantSwatchImage(
  v: Pick<PricedVariant, "imageUrl" | "optionValues">,
  optionImages: OptionImage[] | undefined,
): string | null {
  if (v.imageUrl) return v.imageUrl;
  for (const [name, value] of Object.entries(v.optionValues ?? {})) {
    const img = optionImageFor(optionImages, name, value);
    if (img) return img;
  }
  return null;
}

/**
 * The photo to feature for the current selection. Prefers the server-resolved image
 * of the single selected variant (exact → option → cover → gallery); otherwise, when
 * only an option is picked so far (e.g. a colour in a Colour×Size product), the
 * picked option's image. Returns null when the selection has no distinct photo.
 */
export function selectionHeroImage(
  selVariant: Pick<PricedVariant, "imageUrl" | "resolvedImageUrl"> | null,
  selDimensions: Record<string, string>,
  optionImages: OptionImage[] | undefined,
): string | null {
  if (selVariant?.resolvedImageUrl) return selVariant.resolvedImageUrl;
  if (selVariant?.imageUrl) return selVariant.imageUrl;
  for (const [name, value] of Object.entries(selDimensions)) {
    const img = optionImageFor(optionImages, name, value);
    if (img) return img;
  }
  return null;
}
