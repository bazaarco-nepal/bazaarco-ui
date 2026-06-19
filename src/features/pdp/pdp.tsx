// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  RatingInline,
  Badge,
  OptionChip,
  StatusPill,
  Price,
  Placeholder,
  SkeletonCard,
  EmptyState,
  QtyStepper,
  Toast,
  SectionHead,
  TINTS,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  BottomNav,
  LandmarkAddress,
  VoiceMicButton,
  usePaged,
  usePages,
  LoadMore,
  PageBar,
  BackToTop,
  ApiState,
  AppLink,
} from "@/components/ui";
import { pathFromScreen, productShareUrl, searchPath } from "@/config/routes";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayCategoryLabel } from "@/lib/locale-display";
import { useProduct, useCategories, useSellerTrust, useProductProfile } from "@/hooks/use-catalog";
import {
  BazaarCtx,
  useBz,
  Himalaya,
  KathmanduSkyline,
  ProductCard,
  CategoryTile,
  Navbar,
  Footer,
  DevViewSwitcher,
} from "@/components/common";
import { useSimilar } from "@/hooks/use-search";
import {
  useAcceptCounterOffer,
  useBargainActivity,
  useCreateBargainOffer,
} from "@/hooks/use-bargains";
import { bargainExpiryLabel } from "@/lib/bargain-expiry";
import { formatNPR } from "@/lib/money";
import { matchSelectedVariants, toggleOption, variantBacksOption } from "@/lib/variant-selection";
import { optionImageFor, selectionHeroImage, variantSwatchImage } from "@/lib/variant-images";
import { ApiRequestError } from "@/services/api/http";
import type { PdpProps } from "@/types";
import {
  ReviewsSection,
  QASection,
  ImageLightbox,
  PdpWatchVideoCta,
  TrustChips,
  SellerCard,
} from "./_components";

// Round, glassy control floated over the gallery image (wishlist / share).
const imgOverlayBtn = (color: string): React.CSSProperties => ({
  width: 36,
  height: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.18)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  cursor: "pointer",
  color,
});

/* ============================================================
   BazaarCo — Product Detail Page (video-led)
   ============================================================ */
function BargainModal({ p, variantId = null, listedPrice, original, onClose }) {
  const { addToCart, nav } = useBz();
  const sellerName = p.sellerInfo?.name ?? "seller";
  const createOffer = useCreateBargainOffer();
  // Social proof: other buyers bargaining on this item right now (excludes you).
  const othersBargaining = useBargainActivity(p.id).data ?? 0;
  // Daily attempts left, learned from the server's reply to the last offer.
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  // Bargaining is conducted on the chosen variant's listed (discounted) price.
  // The seller's accept-floor is private — never sent to the buyer — so the
  // starting offer is anchored off the listed price alone.
  const listed = listedPrice ?? p.price;
  const variant = variantId && p.variants ? p.variants.find((v) => v.id === variantId) : null;
  // Suggested starting offer, 10% under the listed price rounded to the nearest 10.
  const suggestedOffer = Math.round((listed * 0.9) / 10) * 10;
  // Held as a string so the field can be emptied while typing — a numeric state
  // would snap a cleared input back to 0 and trap a leading zero (e.g. "0700").
  const [offer, setOffer] = useState(String(suggestedOffer));
  const offerValue = Number(offer);
  // Coarse acceptance hint, derived ONLY from the public listed price — never the
  // seller's floor — so it can't be slid to reverse-engineer the minimum. Three
  // buckets keep it directional, not a precise probability.
  const chance =
    offerValue <= 0 || listed <= 0
      ? null
      : offerValue >= listed * 0.95
        ? { label: "High chance of acceptance", color: "var(--success)", steps: 3 }
        : offerValue >= listed * 0.85
          ? { label: "Medium chance", color: "var(--saffron)", steps: 2 }
          : { label: "Low chance — try a bit higher", color: "var(--red)", steps: 1 };
  const [stage, setStage] = useState("offer"); // offer | thinking | pending | counter | accepted
  const [counter, setCounter] = useState(listed);
  // The server-side offer behind this negotiation: accept-counter needs its id,
  // and the countdown shows its redemption deadline.
  const [offerId, setOfferId] = useState<string | null>(null);
  const [offerExpires, setOfferExpires] = useState<string | null>(null);
  const acceptCounterOffer = useAcceptCounterOffer();
  // The server's nudge when an offer falls below the hidden floor — e.g. "buyers
  // are getting offers around Rs. X accepted". Shown inline under the input so
  // the buyer can raise their offer without ever learning the true floor.
  const [tooLowHint, setTooLowHint] = useState<string | null>(null);
  const submit = async () => {
    if (!offerValue || offerValue <= 0) {
      setTooLowHint("Enter an offer amount to continue.");
      return;
    }
    // A bargain must beat the listed price — at or above it, the buyer can just
    // buy directly. Block here for UX; the backend re-checks authoritatively.
    if (offerValue >= listed) {
      setTooLowHint(
        `This item is already listed at ${formatNPR(listed)}. Enter a lower amount to bargain.`,
      );
      return;
    }
    setTooLowHint(null);
    setStage("thinking");
    try {
      const result = await createOffer.mutateAsync({
        productId: p.id,
        variantId,
        yourOffer: offerValue,
      });
      setOfferId(result.id);
      setOfferExpires(result.expires);
      if (typeof result.attemptsRemaining === "number") setAttemptsLeft(result.attemptsRemaining);
      if (result.sellerCounter) setCounter(result.sellerCounter);
      // A fresh offer always lands with the seller as `pending` — acceptance
      // only ever arrives later, in My Offers. The other branches cover the
      // server answering an already-settled negotiation.
      setStage(
        result.status === "accepted"
          ? "accepted"
          : result.status === "countered"
            ? "counter"
            : "pending",
      );
    } catch (error) {
      const msg = error instanceof ApiRequestError ? error.message : "Could not send offer";
      setTooLowHint(msg);
      setStage("offer");
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? "var(--r-xl) var(--r-xl) 0 0" : "var(--r-xl)",
          width: isMobile ? "100%" : 460,
          maxWidth: isMobile ? "100%" : "calc(100% - 48px)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: isMobile ? "24px 20px calc(24px + env(safe-area-inset-bottom))" : 28,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "var(--line-100)",
            border: "none",
            width: 34,
            height: 34,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="x" size={18} />
        </button>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--blue)",
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          <Icon name="bargain" size={22} color="var(--blue)" /> Make an offer
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          {p.img ? (
            <img
              src={p.img}
              alt={p.name}
              style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--r-md)" }}
            />
          ) : (
            <Placeholder
              icon={p.icon}
              tint={p.tint}
              style={{ width: 72, height: 72 }}
              radius="var(--r-md)"
            />
          )}
          <div>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ marginTop: 4 }}>
              <Price value={listed} original={original ?? undefined} size="sm" />
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>
              Listed price
            </div>
          </div>
        </div>

        {othersBargaining > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
              background: "var(--saffron-50, rgba(234,88,12,.08))",
              fontSize: ".8125rem",
              fontWeight: 600,
              color: "var(--saffron, #c2410c)",
            }}
          >
            🔥 {othersBargaining} other {othersBargaining === 1 ? "buyer is" : "buyers are"}{" "}
            bargaining on this right now
          </div>
        )}

        {stage === "offer" && (
          <>
            <label style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
              Your offer
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 6px" }}>
              <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--blue-deep)" }}>
                Rs.
              </span>
              <input
                type="number"
                value={offer}
                onChange={(e) => {
                  // Keep digits only and drop any leading zeros so the field never
                  // traps a "0" in front of what the buyer types.
                  setOffer(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
                  if (tooLowHint) setTooLowHint(null);
                }}
                className="tnum"
                style={{
                  flex: 1,
                  height: 48,
                  border: `1px solid ${tooLowHint ? "var(--red)" : "var(--line-200)"}`,
                  borderRadius: "var(--r-md)",
                  padding: "0 14px",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            {chance && !tooLowHint && (
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 0" }}
                aria-label={chance.label}
              >
                <div style={{ display: "flex", gap: 3, flex: 1, maxWidth: 120 }}>
                  {[1, 2, 3].map((step) => (
                    <span
                      key={step}
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: step <= chance.steps ? chance.color : "var(--line-200)",
                        transition: "background .2s",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: ".8125rem", fontWeight: 700, color: chance.color }}>
                  {chance.label}
                </span>
              </div>
            )}
            {tooLowHint && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  margin: "8px 0 0",
                  padding: "10px 12px",
                  borderRadius: "var(--r-md)",
                  background: "var(--red-50, rgba(220,38,38,.06))",
                  border: "1px solid var(--red-100, rgba(220,38,38,.18))",
                }}
              >
                <span style={{ flexShrink: 0, lineHeight: 0, marginTop: 1 }}>
                  <Icon name="trendingUp" size={16} color="var(--red)" />
                </span>
                <p
                  style={{
                    fontSize: ".8125rem",
                    color: "var(--red)",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {tooLowHint}
                </p>
              </div>
            )}
            {attemptsLeft !== null && (
              <p
                style={{
                  fontSize: ".75rem",
                  fontWeight: 600,
                  color: attemptsLeft === 0 ? "var(--red)" : "var(--ink-500)",
                  textAlign: "center",
                  margin: "12px 0 0",
                }}
              >
                {attemptsLeft === 0
                  ? "No bargain attempts left today."
                  : `${attemptsLeft} bargain ${attemptsLeft === 1 ? "attempt" : "attempts"} left today.`}
              </p>
            )}
            <div style={{ marginTop: 20 }}>
              <Button variant="primary" full size="lg" onClick={submit}>
                Send offer to seller
              </Button>
            </div>
            <p
              style={{
                fontSize: ".75rem",
                color: "var(--ink-400)",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              The seller has 12 hours to respond. You're not charged until you accept.
            </p>
          </>
        )}

        {stage === "thinking" && (
          <div style={{ padding: "30px 0", textAlign: "center" }}>
            <Spinner size={32} color="var(--blue)" />
            <p style={{ color: "var(--ink-500)", marginTop: 16 }}>
              Sending your offer to {sellerName}…
            </p>
          </div>
        )}

        {stage === "pending" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--tint-blue-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Icon name="clock" size={30} color="var(--blue)" />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Offer sent!</h3>
            <p style={{ color: "var(--ink-500)", marginTop: 8 }}>
              {sellerName} got your offer of <b className="tnum">{formatNPR(offerValue)}</b>. They
              can accept, counter, or decline — we'll show their reply in My Offers.
            </p>
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
              {bargainExpiryLabel(offerExpires)
                ? `The seller has 12 hours to respond · ${bargainExpiryLabel(offerExpires)}`
                : "The seller has 12 hours to respond."}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Button variant="secondary" full onClick={onClose}>
                Keep shopping
              </Button>
              <Button
                variant="primary"
                full
                onClick={() => {
                  onClose();
                  nav("bargains");
                }}
              >
                View my offers
              </Button>
            </div>
          </div>
        )}

        {stage === "accepted" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(22,163,74,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Icon name="check" size={30} color="var(--success)" />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Offer accepted! 🎉</h3>
            <p style={{ color: "var(--ink-500)", marginTop: 8 }}>
              {sellerName} accepted <b className="tnum">{formatNPR(offerValue)}</b>. Add it to your
              cart at this price.
            </p>
            {bargainExpiryLabel(offerExpires) && (
              <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
                Price locked for you · {bargainExpiryLabel(offerExpires)}
              </p>
            )}
            <div style={{ marginTop: 18 }}>
              <Button
                variant="primary"
                full
                size="lg"
                icon="cart"
                onClick={async () => {
                  // No price in the payload — the server binds the accepted
                  // offer to this line and the cart comes back at the agreed price.
                  await addToCart(p, 1, "Added at bargained price!", variantId);
                  onClose();
                }}
              >
                Add to cart · {formatNPR(offerValue)}
              </Button>
            </div>
          </div>
        )}

        {stage === "counter" && (
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: TINTS["blue"][0],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: TINTS["blue"][2],
                }}
              >
                {sellerName[0]}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Seller countered</h3>
            <p style={{ color: "var(--ink-500)", marginTop: 8 }}>
              That's a little low. They can do <b className="tnum">{formatNPR(counter)}</b>.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setOffer(String(suggestedOffer));
                  setStage("offer");
                }}
              >
                Counter again
              </Button>
              <Button
                variant="primary"
                full
                icon="cart"
                onClick={async () => {
                  // The counter only becomes redeemable once the buyer accepts
                  // it server-side; add to cart alone never bound the price.
                  try {
                    if (!offerId) throw new Error("missing offer id");
                    const updated = await acceptCounterOffer.mutateAsync(offerId);
                    setOfferExpires(updated.expires);
                  } catch (error) {
                    const msg =
                      error instanceof ApiRequestError
                        ? error.message
                        : "Could not accept this counter — please try bargaining again.";
                    setTooLowHint(msg);
                    setStage("offer");
                    return;
                  }
                  await addToCart(p, 1, "Deal! Added to cart.", variantId);
                  onClose();
                }}
              >
                Accept {formatNPR(counter)}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Buy-Now option sheet (mobile)
   When an older shopper taps "Buy Now" on a product that has options
   (size / colour), we don't drop them on a blank cart. We slide up a
   focused sheet to confirm the choice, then send them straight to
   checkout. Shows only the item price — never the summed total.
   ------------------------------------------------------------------ */
function BuyNowSheet({
  p,
  price,
  original,
  pricedVariants,
  selVariantId,
  onPickVariant,
  // When set (grouped variants), rendered instead of the flat option list so
  // the sheet shares the page's selection state and rules.
  picker = null,
  onConfirm,
  onClose,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm your choice"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#fff",
          borderTopLeftRadius: "var(--r-xl)",
          borderTopRightRadius: "var(--r-xl)",
          padding: "16px 18px calc(18px + env(safe-area-inset-bottom))",
          boxShadow: "0 -6px 24px rgba(15,23,42,.18)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* grab handle */}
        <div
          aria-hidden
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: "var(--line-200)",
            margin: "0 auto 16px",
          }}
        />
        {/* product summary — image, name, item price (no delivery / total) */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
          {p.img ? (
            <img
              src={p.img}
              alt={p.name}
              style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "var(--r-md)" }}
            />
          ) : (
            <Placeholder
              icon={p.icon}
              tint={p.tint}
              style={{ width: 72, height: 72 }}
              radius="var(--r-md)"
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--ink-900)",
                lineHeight: 1.3,
              }}
            >
              {p.name}
            </div>
            <div style={{ marginTop: 6 }}>
              <Price value={price} original={original ?? undefined} size="md" />
            </div>
          </div>
        </div>

        {/* Priced-variant picker — choosing changes the price above. */}
        {picker ? (
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: ".9375rem",
                fontWeight: 700,
                color: "var(--ink-900)",
              }}
            >
              Choose an option
            </div>
            {picker}
          </div>
        ) : (
          pricedVariants.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: ".9375rem",
                  fontWeight: 700,
                  color: "var(--ink-900)",
                  marginBottom: 10,
                }}
              >
                Choose an option
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {pricedVariants.map((v) => (
                  <OptionChip
                    key={v.id}
                    label={v.name}
                    selected={v.id === selVariantId}
                    soldOut={(v.stock ?? 0) <= 0}
                    trailing={
                      <span className="tnum" style={{ fontSize: ".8125rem", opacity: 0.85 }}>
                        {formatNPR(v.price)}
                      </span>
                    }
                    onClick={() => onPickVariant(v.id)}
                  />
                ))}
              </div>
            </div>
          )
        )}

        <Button variant="primary" full size="lg" onClick={onConfirm}>
          Buy Now
        </Button>
      </div>
    </div>
  );
}

export function PDP({ p: pProp }: PdpProps) {
  const { t } = useTranslation();
  const {
    addToCart,
    buyNow,
    openProduct,
    openStore,
    toggleWish,
    toggleSellerWish,
    wish,
    wishSellers,
    toast,
    nav,
    authed,
    promptLogin,
  } = useBz();
  const productId = pProp.id;
  const { data: productFromApi, isLoading, isError, error } = useProduct(productId);
  const { data: categories = [] } = useCategories();
  const locale = useBazaarStore((s) => s.locale);
  const p = productFromApi ?? pProp;
  const s = p.sellerInfo ?? null;
  // Seller trust signals for the seller card / verified chip (computed server-side).
  const { data: sellerTrust, isLoading: trustLoading } = useSellerTrust(p.seller || null);
  // Humanized [label, value] specs from the product profile (maps raw metadata
  // keys to category-defined display labels). Falls back to raw metadata pairs
  // only if the profile hasn't loaded yet.
  const { data: profile } = useProductProfile(productId);
  // Algolia "find similar" for the recommendations rail.
  const { data: similarItems = [] } = useSimilar(productId, 10);
  const specs: [string, string][] = useMemo(() => {
    if (profile?.specs?.length) return profile.specs;
    if (!p.metadata || typeof p.metadata !== "object") return [];
    return Object.entries(p.metadata)
      .filter(([, v]) => v != null && String(v).trim() !== "")
      .map(([k, v]) => [k, String(v)] as [string, string]);
  }, [profile, p.metadata]);
  const desc = useMemo(() => {
    return p.description?.trim() ?? "";
  }, [p.description]);
  const categoryLabel = useMemo(() => {
    if (p.category?.en) return displayCategoryLabel(p.category, locale);
    const fromCatalog = categories.find((c) => c.id === p.cat);
    return fromCatalog ? displayCategoryLabel(fromCatalog, locale) : p.cat;
  }, [p.cat, p.category, categories, locale]);
  const [mediaIdx, setMediaIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDelta = useRef<number>(0);
  const touchDeltaY = useRef<number>(0);
  const swipeDragging = useRef(false);
  // Gallery, cover first. Falls back to the single cover for older products.
  const gallery = useMemo(
    () => (p.images?.length ? p.images : p.img ? [p.img] : []),
    [p.images, p.img],
  );

  // Share via the native share sheet when available, falling back to copying the link.
  const shareProduct = async () => {
    if (typeof window === "undefined" || !p?.id) return;
    const url = productShareUrl(p.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: `${p.name} · ${formatNPR(p.price)}`, url });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard");
        return;
      }
      toast("Sharing isn't supported on this device");
    } catch (err) {
      // The user dismissing the native share sheet throws AbortError — ignore it.
      if (err instanceof Error && err.name === "AbortError") return;
      toast("Couldn't share this product");
    }
  };
  const [qty, setQty] = useState(1);
  const [buyNowSheet, setBuyNowSheet] = useState(false);
  const [bargain, setBargain] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  // Priced variants (the seller's real SKUs) drive the price a buyer pays and
  // what's added to the cart. The cosmetic template swatches below are suppressed
  // when these exist, so there's a single source of truth for the selection.
  const pricedVariants = p.variants ?? [];
  const hasPricedVariants = pricedVariants.length > 0;
  const variantGroups = p.variantGroups ?? null;
  const isMultiDimVariant = hasPricedVariants && variantGroups && variantGroups.length > 0;

  // For multi-dimensional mode: selected option per dimension
  const [selDimensions, setSelDimensions] = useState<Record<string, string>>({});

  const [selVariantId, setSelVariantId] = useState<string | null>(null);

  useEffect(() => {
    // Grouped/multi-dim products start with nothing selected: the buyer picks
    // exactly what they want (one group, or several) and can unselect again.
    // The price shows the product's "from" price until they do. Flat products
    // keep preselecting the cheapest in-stock option so the price is concrete.
    if (!hasPricedVariants || isMultiDimVariant) {
      setSelVariantId(null);
      setSelDimensions({});
      return;
    }
    const inStock = pricedVariants.filter((v) => (v.stock ?? 0) > 0);
    const pool = inStock.length ? inStock : pricedVariants;
    const cheapest = pool.reduce((m, v) => (v.price < m.price ? v : m), pool[0]);
    setSelVariantId(cheapest.id);
    setSelDimensions({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, p.variants]);

  // A variant is selected when every option it declares matches the buyer's
  // picks. Grouped variants carry a single {group: option} pair, so groups are
  // independent — one pick per group, several can be active at once. Legacy
  // cartesian variants declare every group and so resolve only when all of
  // them are picked, exactly as before.
  const selectedVariants = isMultiDimVariant
    ? matchSelectedVariants(pricedVariants, selDimensions)
    : [];

  const resolvedVariantId: string | null = isMultiDimVariant
    ? selectedVariants.length === 1
      ? selectedVariants[0].id
      : null
    : selVariantId;

  const selVariant = hasPricedVariants
    ? (pricedVariants.find((v) => v.id === resolvedVariantId) ?? null)
    : null;

  // The photo to feature for the current selection, resolved through the seller's
  // option-level images when a SKU has no image of its own (see variant-images).
  // If it isn't already in the main gallery, prepend it so it always appears as the
  // first (hero) slide — Daraz style.
  const selectionImage = selectionHeroImage(selVariant, selDimensions, p.optionImages);
  const variantHeroUrl =
    selectionImage && !gallery.includes(selectionImage) ? selectionImage : null;

  // Gallery slides only — video lives in Watch; PDP links out via PdpWatchVideoCta.
  const gallerySlides = useMemo(() => {
    const slides: string[] = [];
    if (variantHeroUrl) slides.push(variantHeroUrl);
    slides.push(...gallery);
    return slides;
  }, [variantHeroUrl, gallery]);

  // When the selection brings its own featured image, jump to slide 0 (the hero).
  useEffect(() => {
    if (variantHeroUrl) setMediaIdx(0);
  }, [variantHeroUrl]);

  // Full lightbox image list: variant hero first (if not already in gallery), then gallery.
  const lightboxImages = variantHeroUrl ? [variantHeroUrl, ...gallery] : gallery;

  const openPhotoLightbox = (startUrl?: string) => {
    if (lightboxImages.length === 0) return;
    if (startUrl) {
      const mediaI = gallerySlides.indexOf(startUrl);
      if (mediaI >= 0) setMediaIdx(mediaI);
    }
    setLightboxOpen(true);
  };

  const photoIndexFromMedia = (idx: number) => {
    const src = gallerySlides[idx];
    if (!src) return 0;
    const i = lightboxImages.indexOf(src);
    return i >= 0 ? i : 0;
  };

  const setMediaFromPhotoIndex = (photoIdx: number) => {
    const src = lightboxImages[photoIdx];
    if (!src) return;
    const mediaI = gallerySlides.indexOf(src);
    setMediaIdx(mediaI >= 0 ? mediaI : photoIdx);
  };
  // Price reflects what's actually picked: one variant → its price; several
  // (one per group) → their total; nothing yet → the product's "from" price.
  const shownPrice =
    selectedVariants.length > 0
      ? selectedVariants.reduce((sum, v) => sum + v.price, 0)
      : selVariant
        ? selVariant.price
        : p.price;
  const shownOriginal =
    selectedVariants.length > 0
      ? selectedVariants.every((v) => v.original != null)
        ? selectedVariants.reduce((sum, v) => sum + (v.original ?? 0), 0)
        : null
      : selVariant
        ? (selVariant.original ?? null)
        : p.original;
  const disc = shownOriginal ? Math.round((1 - shownPrice / shownOriginal) * 100) : 0;
  // A trivial discount (< 5%) reads like a bug — "-1% OFF" with a near-identical
  // strikethrough. Below the threshold we hide both the badge AND the original
  // price everywhere it's shown, so the price simply reads as the price.
  const showDiscount = disc >= 5;
  const displayOriginal = showDiscount ? shownOriginal : null;
  // Per-variant bargaining: check the selected variant's flag, falling back to product-level.
  const bargainingAvailable = selVariant
    ? Boolean(selVariant.allowBargaining ?? p.allowBargaining)
    : Boolean(p.allowBargaining);

  // Buy controls are disabled when the listing can't be purchased. Stock comes
  // from the server-computed status; wishlist stays active regardless.
  const isOutOfStock =
    p.stockStatus === "out_of_stock" || p.stockStatus === "unavailable" || p.outOfStock === true;
  // Cap the quantity selector at the available stock the server reports.
  const maxQty =
    typeof p.availableStock === "number" && p.availableStock > 0
      ? Math.min(p.availableStock, 99)
      : 99;

  // Shared styling for the desktop detail sections. They read directly on the
  // page — separated by a hairline rule, not boxed in their own cards.
  const detailCardStyle = {
    borderTop: "1px solid var(--line-200)",
    paddingTop: 28,
  } as const;
  const detailTitleStyle = {
    margin: "0 0 14px",
    fontSize: "1.375rem",
    fontWeight: 700,
    color: "var(--ink-900)",
  } as const;
  // One scale for every in-column section label (Colour, Size, Quantity) so they
  // read as the same level — no jump between a muted option label and a bold
  // "Quantity". The selected value is the only emphasis, via `fieldValueStyle`.
  const fieldLabelStyle = {
    fontSize: ".875rem",
    fontWeight: 600,
    color: "var(--ink-700)",
  } as const;
  const fieldValueStyle = {
    fontWeight: 700,
    color: "var(--ink-900)",
  } as const;

  const openBargain = () => {
    if (!authed) {
      promptLogin("Please sign in to make an offer.");
      return;
    }
    // An offer is for one concrete option — its price and its floor.
    if (isMultiDimVariant && !selVariant) {
      toast(
        selectedVariants.length > 1
          ? "Offers work on one option at a time — keep just one selected."
          : "Select an option first to make an offer.",
      );
      return;
    }
    setBargain(true);
  };

  /** For multi-dim mode: whether a given option is available (any SKU backs it) */
  const isOptionAvailable = (dimName: string, optionVal: string): boolean => {
    if (!isMultiDimVariant) return true;
    return pricedVariants.some((v) => variantBacksOption(v, selDimensions, dimName, optionVal));
  };

  const isOptionInStock = (dimName: string, optionVal: string): boolean => {
    if (!isMultiDimVariant) return true;
    return pricedVariants.some(
      (v) => variantBacksOption(v, selDimensions, dimName, optionVal) && (v.stock ?? 0) > 0,
    );
  };

  /** Resolves what the buy CTAs act on, nudging the buyer when nothing usable
   *  is selected. Returns the variant ids to add (one cart line each), or null
   *  after showing the reason. */
  const selectionToBuy = (): Array<string | null> | null => {
    if (!isMultiDimVariant) {
      if (selVariant && (selVariant.stock ?? 0) <= 0) {
        toast(`${selVariant.name} is out of stock`);
        return null;
      }
      return [resolvedVariantId];
    }
    if (selectedVariants.length === 0) {
      toast("Select an option first");
      return null;
    }
    const out = selectedVariants.find((v) => (v.stock ?? 0) <= 0);
    if (out) {
      toast(`${out.name} is out of stock`);
      return null;
    }
    return selectedVariants.map((v) => v.id);
  };

  // Only show a picker when there's an actual choice: a multi-dimension product,
  // or more than one flat variant. A single flat variant (e.g. the synthetic
  // "Default" SKU of a no-variant product) has nothing to pick — selVariantId is
  // still preselected for price/cart, so we just hide the redundant "Option:
  // Default" row.
  const variantPicker =
    hasPricedVariants && (isMultiDimVariant || pricedVariants.length > 1) ? (
      <div style={{ marginTop: 18 }}>
        {isMultiDimVariant ? (
          /* Multi-dimensional picker — one group per dimension (Colour, Size, …) */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {variantGroups!.map((group) => {
              const selectedOpt = selDimensions[group.name];
              return (
                <div key={group.name}>
                  <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>
                    {group.name}
                    {selectedOpt && (
                      <>
                        : <span style={fieldValueStyle}>{selectedOpt}</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {group.options.map((opt) => {
                      const available = isOptionAvailable(group.name, opt);
                      const inStock = isOptionInStock(group.name, opt);
                      // Swatch for this option: a SKU's exact image for it, else the
                      // option-level image (e.g. the "Red" colour photo).
                      const swatchImg =
                        pricedVariants.find(
                          (v) => v.optionValues?.[group.name] === opt && v.imageUrl,
                        )?.imageUrl ?? optionImageFor(p.optionImages, group.name, opt);
                      return (
                        <OptionChip
                          key={opt}
                          label={opt}
                          selected={selectedOpt === opt}
                          unavailable={!available}
                          soldOut={available && !inStock}
                          image={swatchImg}
                          imageAlt={opt}
                          // Tapping the active option unselects it — nothing is forced.
                          onClick={() =>
                            setSelDimensions((prev) => toggleOption(prev, group.name, opt))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {selectedVariants.length === 0 &&
              Object.keys(selDimensions).length > 0 &&
              variantGroups!.every((g) => selDimensions[g.name]) && (
                <div style={{ fontSize: ".8125rem", color: "var(--danger)" }}>
                  This combination is not available.
                </div>
              )}
          </div>
        ) : (
          /* Flat single-dimension picker */
          <>
            <div style={{ ...fieldLabelStyle, marginBottom: 10 }}>
              Option: <span style={fieldValueStyle}>{selVariant?.name}</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {pricedVariants.map((v) => {
                const swatchImg = variantSwatchImage(v, p.optionImages);
                return (
                  <OptionChip
                    key={v.id}
                    label={v.name}
                    selected={v.id === selVariantId}
                    soldOut={(v.stock ?? 0) <= 0}
                    image={swatchImg}
                    imageAlt={v.name}
                    onClick={() => setSelVariantId(v.id)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    ) : null;

  useEffect(() => {
    setMediaIdx(0);
    setDescOpen(false);
    setQty(1);
    setBargain(false);
    setBuyNowSheet(false);
    setLightboxOpen(false);
    // Scroll to top when product changes so the buyer always starts at the top.
    const scrollEl = document.getElementById("app-scroll");
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [productId]);

  const wished = wish.includes(p.id);

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-pdp-root"
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "20px clamp(12px, 4vw, 28px) 0",
        }}
      >
        {/* breadcrumb — desktop only */}
        <div
          className="bz-hide-mobile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".8125rem",
            color: "var(--ink-400)",
            marginBottom: 18,
          }}
        >
          <AppLink href={pathFromScreen("home")} className="bz-crumb">
            Home
          </AppLink>
          <Icon name="chevronRight" size={13} color="var(--ink-300)" />
          <AppLink href={searchPath({ cat: p.cat })} className="bz-crumb">
            {categoryLabel}
          </AppLink>
          <Icon name="chevronRight" size={13} color="var(--ink-300)" />
          <span style={{ color: "var(--ink-700)" }}>{p.name}</span>
        </div>

        {/* MOBILE HERO — clean app-style layout */}
        <div className="bz-show-mobile bz-pdp-mobile">
          <div className="bz-pdp-mobile__gallery">
            {gallerySlides.length > 0 ? (
              <>
                <div
                  className="bz-pdp-mobile__viewport"
                  onTouchStart={(e) => {
                    touchStartX.current = e.touches[0].clientX;
                    touchStartY.current = e.touches[0].clientY;
                    touchDelta.current = 0;
                    touchDeltaY.current = 0;
                  }}
                  onTouchMove={(e) => {
                    if (touchStartX.current == null) return;
                    touchDelta.current = e.touches[0].clientX - touchStartX.current;
                    touchDeltaY.current = e.touches[0].clientY - (touchStartY.current ?? 0);
                  }}
                  onTouchEnd={(e) => {
                    if (touchStartX.current == null) return;
                    const dx = touchDelta.current;
                    const dy = touchDeltaY.current;
                    const maxIdx = Math.max(0, gallerySlides.length - 1);
                    const onImage = (e.target as HTMLElement).closest(".bz-pdp-mobile__zoom-hit");
                    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                      setMediaIdx((i) => Math.max(0, Math.min(maxIdx, i + (dx < 0 ? 1 : -1))));
                    } else if (Math.abs(dx) <= 12 && Math.abs(dy) <= 12 && onImage) {
                      openPhotoLightbox();
                    }
                    touchStartX.current = null;
                    touchStartY.current = null;
                    touchDelta.current = 0;
                    touchDeltaY.current = 0;
                  }}
                >
                  <div
                    className="bz-pdp-mobile__track"
                    style={{ transform: `translate3d(-${mediaIdx * 100}%, 0, 0)` }}
                  >
                    {gallerySlides.map((src, i) => (
                      <div key={`${src}-${i}`} className="bz-pdp-mobile__slide">
                        <button
                          type="button"
                          aria-label="Zoom photo"
                          className="bz-pdp-mobile__zoom-hit"
                          onClick={openPhotoLightbox}
                        >
                          <img src={src} alt={p.name} draggable={false} />
                        </button>
                      </div>
                    ))}
                  </div>{" "}
                  {/* Floating back */}
                  <button
                    type="button"
                    aria-label="Back"
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => window.history.back()}
                    className="bz-pdp-m-fab bz-pdp-m-fab--back"
                    style={{ top: 10, left: 10 }}
                  >
                    <Icon name="chevronLeft" size={22} stroke={2.5} />
                  </button>
                  {/* Floating wishlist + share */}
                  <button
                    type="button"
                    aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => toggleWish(p.id)}
                    className="bz-pdp-m-fab"
                    style={{
                      top: 12,
                      right: 56,
                      color: wished ? "var(--red)" : "var(--ink-700)",
                    }}
                  >
                    <Icon name="heart" size={18} fill={wished ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    aria-label="Share"
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={shareProduct}
                    className="bz-pdp-m-fab"
                    style={{ top: 12, right: 12 }}
                  >
                    <Icon name="share" size={16} />
                  </button>
                  {/* Watch video — floats over the image (borrowed from desktop). */}
                  {p.hasVideo && <PdpWatchVideoCta productId={p.id} thumb={p.videoThumb} overlay />}
                  {/* Dots */}
                  {gallerySlides.length > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 14,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 6,
                        pointerEvents: "none",
                      }}
                    >
                      {gallerySlides.map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: i === mediaIdx ? 18 : 6,
                            height: 6,
                            borderRadius: 999,
                            background: i === mediaIdx ? "var(--ink-900)" : "rgba(15,23,42,.25)",
                            transition: "all .2s ease",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {gallerySlides.filter((src) => src !== variantHeroUrl).length > 1 && (
                  <div className="bz-pdp-mobile__thumbs" role="tablist" aria-label="Product photos">
                    {gallerySlides.map((src, i) => {
                      if (src === variantHeroUrl) return null;
                      return (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-label="View product photo"
                          aria-selected={i === mediaIdx}
                          className="bz-pdp-mobile__thumb"
                          onClick={() => setMediaIdx(i)}
                        >
                          <img src={src} alt="" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <Placeholder icon={p.icon} tint={p.tint} ratio="1 / 1" radius="var(--r-lg)" />
            )}
          </div>

          {/* Product header — no own L/R padding; it sits on the page's single
              16px gutter (same as the homepage and every other block). */}
          <div style={{ padding: "14px 0 16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  flex: 1,
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: "var(--ink-900)",
                  lineHeight: 1.32,
                }}
              >
                {p.name}
              </h1>
              <div style={{ marginTop: 4, whiteSpace: "nowrap" }}>
                <RatingInline rating={p.rating} count={p.reviews} size={14} />
              </div>
            </div>
            <div className="bz-pdp-price-row">
              <div className="bz-pdp-price-row__main">
                {isMultiDimVariant && selectedVariants.length === 0 && (
                  <span style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>From</span>
                )}
                <Price value={shownPrice} original={displayOriginal ?? undefined} size="lg" />
                {showDiscount && <Badge tone="saffron">-{disc}% OFF</Badge>}
              </div>
            </div>

            {/* Backend-driven trust signals — stock, returns, warranty, secure checkout */}
            <div style={{ marginTop: 14 }}>
              <TrustChips product={p} />
            </div>

            {variantPicker}

            {/* Delivery — general info only; exact address + fee live in checkout */}
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontSize: ".8125rem",
                color: "var(--ink-500)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="truck" size={15} color="var(--ink-400)" />
              Standard delivery · fee calculated at checkout
            </p>
          </div>

          {/* Seller — slim one-line strip; trust signals computed server-side. */}
          {(s || sellerTrust) && (
            <SellerCard
              sellerId={p.seller}
              seller={s}
              trust={sellerTrust}
              loading={trustLoading}
              slim
            />
          )}
        </div>

        <div
          className="bz-stack-900 bz-hide-mobile"
          style={{
            display: "grid",
            // Three columns, each with one job: gallery · what it is · buy box.
            // Image rail (~440) and the sticky buy box (340) are fixed so the
            // middle "what it is" column flexes without sprawling or leaving the
            // right side dead.
            gridTemplateColumns: "440px minmax(0, 1fr) 340px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* MEDIA — vertical thumbnail rail + compact main image (Daraz/Amazon style) */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {gallerySlides.filter((src) => src !== variantHeroUrl).length > 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  width: 60,
                  maxHeight: 440,
                  overflowY: "auto",
                  flex: "0 0 auto",
                }}
              >
                {gallerySlides.map((src, i) => {
                  if (src === variantHeroUrl) return null;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMediaIdx(i)}
                      onMouseEnter={() => setMediaIdx(i)}
                      aria-label={`View photo ${i + 1}`}
                      aria-pressed={mediaIdx === i}
                      style={{
                        flex: "0 0 auto",
                        width: 56,
                        height: 56,
                        borderRadius: "var(--r-md)",
                        overflow: "hidden",
                        border: `2px solid ${mediaIdx === i ? "var(--blue)" : "var(--line-200)"}`,
                        cursor: "pointer",
                        padding: 0,
                        background: "#fff",
                      }}
                    >
                      <img
                        src={src}
                        alt={`${p.name} view ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {gallerySlides.length > 0 ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 420,
                    height: 460,
                    borderRadius: "var(--r-lg)",
                    overflow: "hidden",
                    background: "#fff",
                    border: "1px solid var(--line-200)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    aria-label="Zoom photo"
                    onClick={openPhotoLightbox}
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      padding: 0,
                      border: "none",
                      background: "none",
                      cursor: "zoom-in",
                    }}
                  >
                    <img
                      src={gallerySlides[mediaIdx] ?? gallerySlides[0]}
                      alt={p.name}
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        // Fill the box (no top/bottom whitespace). The lightbox
                        // shows the full uncropped image on zoom.
                        objectFit: "cover",
                        pointerEvents: "none",
                      }}
                    />
                  </button>
                  {/* Quiet overlays — every secondary action lives on the image,
                      not floating beside the title. */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      display: "flex",
                      gap: 8,
                      zIndex: 2,
                    }}
                  >
                    <button
                      type="button"
                      aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                      onClick={() => toggleWish(p.id)}
                      style={imgOverlayBtn(wished ? "var(--red)" : "var(--ink-700)")}
                    >
                      <Icon name="heart" size={17} fill={wished ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      aria-label="Share"
                      onClick={shareProduct}
                      style={imgOverlayBtn("var(--ink-700)")}
                    >
                      <Icon name="share" size={15} />
                    </button>
                  </div>
                  {p.hasVideo && (
                    <PdpWatchVideoCta productId={p.id} thumb={p.videoThumb} overlay />
                  )}{" "}
                </div>
              ) : (
                <div style={{ maxWidth: 420 }}>
                  <Placeholder icon={p.icon} tint={p.tint} ratio="1 / 1" radius="var(--r-lg)" />
                </div>
              )}
            </div>
          </div>

          {/* INFO — middle column: what the product is. Reads title → rating →
              price → trust → choose → quantity. All purchase actions live in the
              sticky buy box on the right. */}
          <div className="bz-pdp-info">
            <h1
              style={{
                margin: 0,
                fontSize: "1.375rem",
                fontWeight: 700,
                color: "var(--ink-900)",
                lineHeight: 1.25,
              }}
            >
              {p.name}
            </h1>

            {/* Rating — directly under the title, above the price. */}
            <div style={{ margin: "8px 0 12px" }}>
              <RatingInline rating={p.rating} count={p.reviews} size={14} />
            </div>

            <div className="bz-pdp-price-row bz-pdp-price-row--desktop">
              <div className="bz-pdp-price-row__main">
                {isMultiDimVariant && selectedVariants.length === 0 && (
                  <span style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>From</span>
                )}
                <Price value={shownPrice} original={displayOriginal ?? undefined} size="lg" />
                {showDiscount && <Badge tone="saffron">-{disc}% OFF</Badge>}
              </div>
            </div>

            {/* Backend-driven trust signals — one calm chip row, stock-coloured only. */}
            <div style={{ margin: "12px 0 4px" }}>
              <TrustChips product={p} />
            </div>

            {variantPicker}

            {/* Quantity ends the column — the last decision before the buy box. */}
            <div
              style={{
                marginTop: 18,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={fieldLabelStyle}>Quantity</span>
              <QtyStepper value={qty} onChange={setQty} max={maxQty} />
            </div>
          </div>

          {/* BUY BOX — right column, sticky. The place you act: the three
              actions in weight order, then the seller. */}
          <aside style={{ position: "sticky", top: 102 }}>
            <div
              style={{
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                background: "var(--card)",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Actions in weight order: Buy now → Add to cart → Make an offer.
                  Price + stock already read in the middle column, so the buy box
                  stays purely about acting. */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Button
                  variant="primary"
                  full
                  disabled={isOutOfStock}
                  onClick={() => {
                    const sel = selectionToBuy();
                    if (sel) void buyNow(p, qty, sel);
                  }}
                >
                  {isOutOfStock ? "Unavailable" : "Buy now"}
                </Button>
                <Button
                  variant="secondary"
                  full
                  icon="cart"
                  disabled={isOutOfStock}
                  onClick={() => {
                    const sel = selectionToBuy();
                    if (sel) void addToCart(p, qty, undefined, sel);
                  }}
                >
                  Add to cart
                </Button>

                {bargainingAvailable && (
                  <Button
                    variant="danger"
                    full
                    icon="bargain"
                    disabled={isOutOfStock}
                    onClick={openBargain}
                  >
                    {t("pdp.makeOffer")}
                  </Button>
                )}
              </div>

              {/* Seller — embedded so the buy box reads as one card. */}
              <div style={{ borderTop: "1px solid var(--line-200)", paddingTop: 14 }}>
                <SellerCard
                  sellerId={p.seller}
                  seller={s}
                  trust={sellerTrust}
                  loading={trustLoading}
                  embedded
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Detail sections — MOBILE: full-scroll stacked sections, each split off
            by a thick neutral bar (native-app layout). Desktop uses the sequential
            hairline layout below. */}
        <div className="bz-show-mobile">
          <section className="bz-pdp-msec">
            <h4>Description</h4>
            {desc ? (
              <>
                <p
                  style={{
                    color: "var(--ink-600)",
                    fontSize: ".84375rem",
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: "pre-line",
                    display: descOpen ? "block" : "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: descOpen ? "unset" : 3,
                    overflow: "hidden",
                  }}
                >
                  {desc}
                </p>
                {desc.length > 160 && (
                  <button
                    onClick={() => setDescOpen((o) => !o)}
                    style={{
                      marginTop: 8,
                      background: "none",
                      border: "none",
                      color: "var(--blue-deep)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: ".78125rem",
                    }}
                  >
                    {descOpen ? "Read less" : "Read more"}
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: "var(--ink-400)", margin: 0, fontSize: ".84375rem" }}>
                No product description has been added yet.
              </p>
            )}
          </section>

          <section className="bz-pdp-msec">
            <h4>Specifications</h4>
            {specs.length > 0 ? (
              <div style={{ fontSize: ".8125rem" }}>
                {specs.map(([k, v], i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: i === specs.length - 1 ? "none" : "1px solid var(--line-200)",
                    }}
                  >
                    <span style={{ color: "var(--ink-500)", flex: "0 0 92px" }}>{k}</span>
                    <span
                      style={{ color: "var(--ink-900)", fontWeight: 500, wordBreak: "break-word" }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--ink-400)", margin: 0, fontSize: ".84375rem" }}>
                No specifications have been added for this product yet.
              </p>
            )}
          </section>

          <section className="bz-pdp-msec">
            <h4>Reviews</h4>
            <ReviewsSection productId={p.id} rating={p.rating} reviewCount={p.reviews} />
          </section>

          <section className="bz-pdp-msec">
            <h4>Q&amp;A</h4>
            <QASection productId={p.id} />
          </section>
        </div>

        {/* Detail sections — DESKTOP: sequential, hairline-separated sections
            sitting directly on the page (mobile uses the stacked card above). */}
        <div
          className="bz-hide-mobile"
          style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 28 }}
        >
          {/* Product Description */}
          <section style={detailCardStyle}>
            <h2 style={detailTitleStyle}>Product Description</h2>
            {desc ? (
              <>
                <p
                  style={{
                    color: "var(--ink-600)",
                    fontSize: ".8125rem",
                    lineHeight: 1.75,
                    margin: 0,
                    whiteSpace: "pre-line",
                    display: descOpen ? "block" : "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: descOpen ? "unset" : 6,
                    overflow: "hidden",
                  }}
                >
                  {desc}
                </p>
                {desc.length > 280 && (
                  <button
                    onClick={() => setDescOpen((o) => !o)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--blue)",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "10px 0 0",
                      fontSize: ".8125rem",
                    }}
                  >
                    {descOpen ? "Read less" : "Read more"}
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: "var(--ink-400)", margin: 0, fontSize: ".8125rem" }}>
                No product description has been added yet.
              </p>
            )}
          </section>

          {/* Product Specifications */}
          <section style={detailCardStyle}>
            <h2 style={detailTitleStyle}>Product Specifications</h2>
            {specs.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 640 }}>
                <tbody>
                  {specs.map(([k, v], i) => (
                    <tr
                      key={i}
                      style={{ background: i % 2 === 1 ? "var(--line-100)" : "transparent" }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "var(--ink-500)",
                          fontSize: ".8125rem",
                          width: 200,
                          verticalAlign: "top",
                        }}
                      >
                        {k}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "var(--ink-800)",
                          fontSize: ".8125rem",
                          fontWeight: 500,
                        }}
                      >
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--ink-400)", margin: 0, fontSize: ".8125rem" }}>
                No specifications have been added for this product yet.
              </p>
            )}
          </section>

          {/* Customer Reviews */}
          <section style={detailCardStyle}>
            <h2 style={detailTitleStyle}>Customer Reviews</h2>
            <ReviewsSection productId={p.id} rating={p.rating} reviewCount={p.reviews} />
          </section>

          {/* Questions & Answers */}
          <section style={detailCardStyle}>
            <h2 style={detailTitleStyle}>Questions &amp; Answers</h2>
            <p style={{ margin: "-4px 0 16px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
              Ask questions about product details, warranty, delivery, or usage.
            </p>
            <QASection productId={p.id} />
          </section>
        </div>

        {similarItems.length > 0 && (
          <div className="bz-pdp-similar">
            <SectionHead title="Similar items" />
            <div className="bz-picks-grid">
              {similarItems.map((rp) => (
                <ProductCard key={rp.id} p={rp} onClick={openProduct} />
              ))}
            </div>
          </div>
        )}

        {bargain && bargainingAvailable && (
          <BargainModal
            p={p}
            variantId={resolvedVariantId}
            listedPrice={shownPrice}
            original={displayOriginal}
            onClose={() => setBargain(false)}
          />
        )}
        {lightboxOpen && lightboxImages.length > 0 && (
          <ImageLightbox
            images={lightboxImages}
            index={photoIndexFromMedia(mediaIdx)}
            alt={p.name}
            onIndex={setMediaFromPhotoIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* Mobile sticky buy bar — Buy Now opens an option sheet when the
            product has choices; otherwise it goes straight to checkout. */}
        <MobileBuyBar
          onAdd={() => {
            const sel = selectionToBuy();
            if (sel) void addToCart(p, qty, undefined, sel);
          }}
          onBuy={() => {
            if (hasPricedVariants) {
              setBuyNowSheet(true);
              return;
            }
            const sel = selectionToBuy();
            if (sel) void buyNow(p, qty, sel);
          }}
          onBargain={bargainingAvailable ? openBargain : undefined}
          disabled={isOutOfStock}
        />

        {buyNowSheet && (
          <BuyNowSheet
            p={p}
            price={shownPrice}
            original={displayOriginal}
            pricedVariants={pricedVariants}
            selVariantId={resolvedVariantId}
            onPickVariant={setSelVariantId}
            // Grouped products confirm with the same picker as the page, so the
            // sheet and the page never disagree about what's selected.
            picker={isMultiDimVariant ? variantPicker : null}
            onConfirm={() => {
              const sel = selectionToBuy();
              if (!sel) return;
              setBuyNowSheet(false);
              void buyNow(p, qty, sel);
            }}
            onClose={() => setBuyNowSheet(false)}
          />
        )}
      </div>
    </ApiState>
  );
}
