"use client";

import { Button } from "@/components/ui";
import { pathFromScreen } from "@/config/routes";
import type { Product } from "@/types";
import { useBz } from "@/components/common";

type ActionSize = "sm" | "md" | "lg";

export function PdpAddToCartButton({
  product,
  size = "lg",
  full = true,
  label = "Add to cart",
}: {
  product: Product;
  size?: ActionSize;
  full?: boolean;
  label?: string;
}) {
  const { addToCart } = useBz();
  const unavailable =
    product.outOfStock === true ||
    product.stockStatus === "out_of_stock" ||
    product.stockStatus === "unavailable";

  return (
    <Button
      variant="primary"
      size={size}
      full={full}
      icon="cart"
      disabled={unavailable}
      onClick={() => void addToCart(product, 1, "Added from Watch")}
    >
      {unavailable ? "Unavailable" : label}
    </Button>
  );
}

export function PdpMakeOfferButton({
  product,
  size = "lg",
  full = true,
}: {
  product: Product;
  size?: ActionSize;
  full?: boolean;
}) {
  const { openProduct } = useBz();
  const unavailable =
    product.outOfStock === true ||
    product.stockStatus === "out_of_stock" ||
    product.stockStatus === "unavailable";

  if (!product.allowBargaining) return null;

  return (
    <Button
      variant="bargainOutline"
      size={size}
      full={full}
      icon="bargain"
      disabled={unavailable}
      onClick={() => openProduct(product, { offer: true })}
    >
      Make an offer
    </Button>
  );
}

export function PdpWishlistButton({
  product,
  size = "lg",
  full = true,
}: {
  product: Product;
  size?: ActionSize;
  full?: boolean;
}) {
  const { savedProducts, toggleSaved } = useBz();
  const saved = savedProducts.includes(product.id);

  return (
    <Button
      variant="secondary"
      size={size}
      full={full}
      icon="heart"
      aria-pressed={saved}
      onClick={() => void toggleSaved(product.id, product.name)}
    >
      {saved ? "Saved" : "Save to wishlist"}
    </Button>
  );
}

export function PdpViewProductLink({
  product,
  label = "View product",
}: {
  product: Product;
  label?: string;
}) {
  const { openProduct } = useBz();
  return (
    <Button
      variant="link"
      href={pathFromScreen("pdp", product.id)}
      onNavigate={() => openProduct(product)}
      iconRight="arrowRight"
    >
      {label}
    </Button>
  );
}
