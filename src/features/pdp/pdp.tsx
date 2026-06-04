// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  RatingStars,
  Chip,
  StatusPill,
  Price,
  Placeholder,
  VideoPlayer,
  SkeletonCard,
  EmptyState,
  QtyStepper,
  Toast,
  SectionHead,
  TINTS,
  DeliverToModal,
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
import { pathFromScreen } from "@/config/routes";
import { useBazaarStore } from "@/store/bazaar-store";
import { formatDeliverToLabel } from "@/lib/delivery-location";
import {
  useCatalog,
  useProduct,
  useProductReviews,
  useProductProfile,
  useRatingDistribution,
} from "@/hooks/use-catalog";
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
  SellerRow,
} from "@/components/common";
import { useSeller } from "@/hooks/use-catalog";
import { useCreateBargainOffer } from "@/hooks/use-bargains";
import { ApiRequestError } from "@/services/api/http";
import type { PdpProps } from "@/types";
import { ReviewsSection, QASection, ImageLightbox, PdpZoomButton } from "./_components";

// Flat Rs. 100 delivery (matches checkout's default; no backend fee endpoint yet).
const DELIVERY_FEE = 100;

type TabItem = { key: string; label: string; content: React.ReactNode };

function TabbedPair({ items }: { items: TabItem[] }) {
  const [active, setActive] = useState(items[0]?.key ?? "");
  return (
    <div>
      <div
        className="bz-tab-bar"
        role="tablist"
        style={{
          display: "flex",
          gap: 18,
          borderBottom: "1px solid var(--line-200)",
          marginBottom: 18,
        }}
      >
        {items.map((it) => {
          const on = active === it.key;
          return (
            <button
              key={it.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(it.key)}
              className={`bz-tab-btn${on ? " bz-tab-btn--active" : ""}`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {items.map((it) => {
        const on = active === it.key;
        return (
          <section
            key={it.key}
            className={`bz-tab-pane${on ? " bz-tab-pane--active" : " bz-tab-pane--inactive"}`}
            style={{ marginBottom: 32 }}
          >
            <h3
              className="bz-tab-pane__title"
              style={{
                margin: "0 0 12px",
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--ink-800)",
              }}
            >
              {it.label}
            </h3>
            {it.content}
          </section>
        );
      })}
    </div>
  );
}

/* ============================================================
   BazaarCo — Product Detail Page (video-led)
   ============================================================ */
function BargainModal({ p, onClose }) {
  const { addToCart, toast } = useBz();
  const { sellerOf } = useCatalog();
  const createOffer = useCreateBargainOffer();
  const [offer, setOffer] = useState(Math.round((p.price * 0.9) / 10) * 10);
  const [stage, setStage] = useState("offer"); // offer | thinking | counter | accepted
  const [counter, setCounter] = useState(Math.round((p.price * 0.93) / 10) * 10);
  const submit = async () => {
    setStage("thinking");
    try {
      const result = await createOffer.mutateAsync({ productId: p.id, yourOffer: offer });
      setCounter(result.sellerCounter ?? Math.round((p.price * 0.93) / 10) * 10);
      setStage(result.status === "accepted" ? "accepted" : "counter");
    } catch (error) {
      const msg = error instanceof ApiRequestError ? error.message : "Could not send offer";
      toast(msg);
      setStage("offer");
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "var(--r-xl)",
          width: 460,
          maxWidth: "100%",
          padding: 28,
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
              <Price value={p.price} original={p.original} size="sm" />
            </div>
            <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>
              Listed price
            </div>
          </div>
        </div>

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
                onChange={(e) => setOffer(+e.target.value)}
                className="tnum"
                style={{
                  flex: 1,
                  height: 48,
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  padding: "0 14px",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <input
              type="range"
              min={Math.round(p.price * 0.7)}
              max={p.price}
              step={10}
              value={offer}
              onChange={(e) => setOffer(+e.target.value)}
              style={{ width: "100%", accentColor: "var(--red)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: ".75rem",
                color: "var(--ink-400)",
                marginTop: 2,
              }}
            >
              <span className="tnum">Rs. {Math.round(p.price * 0.7).toLocaleString()}</span>
              <span className="tnum">Rs. {p.price.toLocaleString()}</span>
            </div>
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
              Sellers usually reply within a few minutes. You're not charged until you accept.
            </p>
          </>
        )}

        {stage === "thinking" && (
          <div style={{ padding: "30px 0", textAlign: "center" }}>
            <Spinner size={32} color="var(--blue)" />
            <p style={{ color: "var(--ink-500)", marginTop: 16 }}>
              Sending your offer to {sellerOf(p)?.name ?? "seller"}…
            </p>
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
              {sellerOf(p)?.name} accepted <b className="tnum">Rs. {offer.toLocaleString()}</b>. Add
              it to your cart at this price.
            </p>
            <div style={{ marginTop: 18 }}>
              <Button
                variant="primary"
                full
                size="lg"
                icon="cart"
                onClick={async () => {
                  await addToCart({ ...p, price: offer }, 1, "Added at bargained price!");
                  onClose();
                }}
              >
                Add to cart · Rs. {offer.toLocaleString()}
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
                  background: TINTS[sellerOf(p)?.tint ?? "blue"][0],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: TINTS[sellerOf(p)?.tint ?? "blue"][2],
                }}
              >
                {sellerOf(p)?.name?.[0]}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "1.125rem" }}>Seller countered</h3>
            <p style={{ color: "var(--ink-500)", marginTop: 8 }}>
              That's a little low. They can do{" "}
              <b className="tnum">Rs. {counter.toLocaleString()}</b>.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setOffer(Math.round((p.price * 0.9) / 10) * 10);
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
                  await addToCart({ ...p, price: counter }, 1, "Deal! Added to cart.");
                  onClose();
                }}
              >
                Accept Rs. {counter.toLocaleString()}
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
function BuyNowSheet({ p, variants, variantSel, onPick, onConfirm, onClose }) {
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
              <Price value={p.price} original={p.original} size="md" />
            </div>
          </div>
        </div>

        {/* variant pickers — large, tappable */}
        {variants.map((v) => {
          const sel = variantSel[v.name] ?? 0;
          const isColor = v.kind === "swatch";
          return (
            <div key={v.name} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: ".9375rem",
                  fontWeight: 700,
                  color: "var(--ink-900)",
                  marginBottom: 10,
                }}
              >
                Choose {v.name}:{" "}
                <span style={{ color: "var(--ink-500)", fontWeight: 600 }}>
                  {isColor ? v.options[sel]?.label : v.options[sel]}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {v.options.map((opt, i) =>
                  isColor ? (
                    <button
                      key={i}
                      type="button"
                      aria-label={opt.label}
                      onClick={() => onPick(v.name, i)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        cursor: "pointer",
                        border: `2.5px solid ${sel === i ? "var(--ink-900)" : "var(--line-200)"}`,
                        padding: 4,
                        background: "#fff",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: TINTS[opt.tint][2],
                        }}
                      />
                    </button>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onPick(v.name, i)}
                      style={{
                        minWidth: 60,
                        height: 50,
                        padding: "0 18px",
                        borderRadius: "var(--r-md)",
                        cursor: "pointer",
                        border: `2px solid ${sel === i ? "var(--ink-900)" : "var(--line-200)"}`,
                        background: sel === i ? "var(--ink-900)" : "#fff",
                        color: sel === i ? "#fff" : "var(--ink-800)",
                        fontWeight: 700,
                        fontSize: "1rem",
                      }}
                    >
                      {opt}
                    </button>
                  ),
                )}
              </div>
            </div>
          );
        })}

        <Button variant="primary" full size="lg" onClick={onConfirm}>
          Buy Now
          <span className="ne" style={{ fontWeight: 600, opacity: 0.92 }}>
            · तुरुन्तै किन्नुहोस्
          </span>
        </Button>
      </div>
    </div>
  );
}

export function PDP({ p: pProp }: PdpProps) {
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
  const { data: productFromApi, isLoading: productDetailLoading } = useProduct(productId);
  const catalog = useCatalog();
  const deliveryLocation = useBazaarStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useBazaarStore((s) => s.setDeliveryLocation);
  const hasDeliveryLoc = Boolean(deliveryLocation?.city);
  const p = productFromApi ?? pProp;
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(productId);
  const { data: profile, isLoading: profileLoading } = useProductProfile(productId);
  const { data: ratingDist = [], isLoading: ratingLoading } = useRatingDistribution(productId);
  const isLoading =
    productDetailLoading || catalog.isLoading || reviewsLoading || profileLoading || ratingLoading;
  const isError = catalog.isError;
  const error = catalog.error;
  const { products, categories, sellerOf } = catalog;
  const { data: sellerFromApi } = useSeller(p.seller);
  const s = sellerOf(p) ?? sellerFromApi;
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id);
  const { variants = [], specs = [] } = profile ?? {};
  const desc = useMemo(() => {
    const fromListing = p.description?.trim();
    if (fromListing) return fromListing;
    return profile?.desc?.trim() ?? "";
  }, [p.description, profile?.desc]);
  const [mediaIdx, setMediaIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDelta = useRef<number>(0);
  const swipeDragging = useRef(false);
  // Gallery, cover first. Falls back to the single cover for older products.
  const gallery = p.images?.length ? p.images : p.img ? [p.img] : [];
  // Unified media list — photos plus an optional video slide at the end.
  const media = [
    ...gallery.map((src) => ({ type: "photo" as const, src })),
    ...(p.hasVideo ? [{ type: "video" as const, src: p.videoUrl, thumb: p.videoThumb }] : []),
  ];

  const photoIndexFromMedia = (idx: number) => {
    const item = media[idx];
    if (item?.type === "photo") {
      const i = gallery.indexOf(item.src);
      return i >= 0 ? i : 0;
    }
    return 0;
  };

  const setMediaFromPhotoIndex = (photoIdx: number) => {
    const src = gallery[photoIdx];
    if (!src) return;
    const mediaI = media.findIndex((m) => m.type === "photo" && m.src === src);
    setMediaIdx(mediaI >= 0 ? mediaI : photoIdx);
  };

  const openPhotoLightbox = () => {
    if (gallery.length > 0) setLightboxOpen(true);
  };
  const [qty, setQty] = useState(1);
  const [buyNowSheet, setBuyNowSheet] = useState(false);
  const [bargain, setBargain] = useState(false);
  const bargainingAvailable = Boolean(p.allowBargaining);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [variantSel, setVariantSel] = useState<Record<string, number>>({});
  const disc = p.original ? Math.round((1 - p.price / p.original) * 100) : 0;

  useEffect(() => {
    setMediaIdx(0);
    setDescOpen(false);
    setQty(1);
    setBargain(false);
    setBuyNowSheet(false);
    setLightboxOpen(false);
    setDeliverOpen(false);
  }, [productId]);

  useEffect(() => {
    setVariantSel(
      Object.fromEntries((profile?.variants ?? []).map((v) => [v.name, v.default || 0])),
    );
  }, [productId, profile?.variants]);
  const wished = wish.includes(p.id);
  const pickVariant = (name, i) => setVariantSel((prev) => ({ ...prev, [name]: i }));

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
          <AppLink href={pathFromScreen("browse")} className="bz-crumb">
            {(categories ?? []).find((c) => c.id === p.cat)?.en}
          </AppLink>
          <Icon name="chevronRight" size={13} color="var(--ink-300)" />
          <span style={{ color: "var(--ink-700)" }}>{p.name}</span>
        </div>

        {/* MOBILE HERO — clean app-style layout */}
        <div className="bz-show-mobile bz-pdp-mobile">
          <div className="bz-pdp-mobile__gallery">
            {media.length > 0 ? (
              <>
                <div
                  className="bz-pdp-mobile__viewport"
                  onTouchStart={(e) => {
                    touchStartX.current = e.touches[0].clientX;
                    touchDelta.current = 0;
                  }}
                  onTouchMove={(e) => {
                    if (touchStartX.current == null) return;
                    touchDelta.current = e.touches[0].clientX - touchStartX.current;
                  }}
                  onTouchEnd={() => {
                    if (touchStartX.current == null) return;
                    const dx = touchDelta.current;
                    const maxIdx = Math.max(0, media.length - 1);
                    if (Math.abs(dx) > 40) {
                      setMediaIdx((i) => Math.max(0, Math.min(maxIdx, i + (dx < 0 ? 1 : -1))));
                    } else if (Math.abs(dx) <= 12 && media[mediaIdx]?.type === "photo") {
                      openPhotoLightbox();
                    }
                    touchStartX.current = null;
                    touchDelta.current = 0;
                  }}
                >
                  <div
                    className="bz-pdp-mobile__track"
                    style={{ transform: `translate3d(-${mediaIdx * 100}%, 0, 0)` }}
                  >
                    {media.map((m, i) => (
                      <div key={`${m.type}-${i}`} className="bz-pdp-mobile__slide">
                        {m.type === "photo" ? (
                          <button
                            type="button"
                            aria-label="Zoom photo"
                            className="bz-pdp-mobile__zoom-hit"
                            onClick={openPhotoLightbox}
                          >
                            <img src={m.src} alt={p.name} draggable={false} />
                          </button>
                        ) : (
                          <VideoPlayer
                            tint={p.tint}
                            icon={p.icon}
                            ratio="1 / 1"
                            autoplay={mediaIdx === i}
                            thumb={m.thumb}
                            src={m.src}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {media[mediaIdx]?.type === "photo" && gallery.length > 0 && (
                    <PdpZoomButton onClick={openPhotoLightbox} />
                  )}
                  {/* Floating back */}
                  <button
                    type="button"
                    aria-label="Back"
                    onClick={() => window.history.back()}
                    className="bz-pdp-m-fab"
                    style={{ top: 12, left: 12 }}
                  >
                    <Icon name="chevronLeft" size={18} />
                  </button>
                  {/* Floating wishlist + share */}
                  <button
                    type="button"
                    aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
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
                    className="bz-pdp-m-fab"
                    style={{ top: 12, right: 12 }}
                  >
                    <Icon name="share" size={16} />
                  </button>
                  {/* Dots */}
                  {media.length > 1 && (
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
                      {media.map((_, i) => (
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
                {gallery.length > 1 && (
                  <div className="bz-pdp-mobile__thumbs" role="tablist" aria-label="Product photos">
                    {gallery.map((src) => {
                      const thumbMediaIdx = media.findIndex(
                        (m) => m.type === "photo" && m.src === src,
                      );
                      return (
                        <button
                          key={src}
                          type="button"
                          role="tab"
                          aria-label="View product photo"
                          aria-pressed={thumbMediaIdx === mediaIdx}
                          className="bz-pdp-mobile__thumb"
                          onClick={() => setMediaIdx(thumbMediaIdx >= 0 ? thumbMediaIdx : 0)}
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

          {/* Product header */}
          <div style={{ padding: "18px 4px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--ink-900)",
                  lineHeight: 1.25,
                }}
              >
                {p.name}
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: ".8125rem",
                  color: "var(--ink-600)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  marginTop: 4,
                }}
              >
                <Icon name="star" size={14} color="var(--gold)" fill="var(--gold)" />
                {p.rating.toFixed(1)} ({p.reviews})
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <Price value={p.price} original={p.original} size="lg" />
            </div>

            {/* Variants — color swatches + size pills, same logic as desktop */}
            {variants.map((v) => {
              const sel = variantSel[v.name] ?? 0;
              const isColor = v.kind === "swatch";
              return (
                <div key={v.name} style={{ marginTop: 18 }}>
                  <div
                    style={{
                      fontSize: ".8125rem",
                      color: "var(--ink-500)",
                      marginBottom: 8,
                    }}
                  >
                    {v.name}:{" "}
                    <span style={{ color: "var(--ink-900)", fontWeight: 600 }}>
                      {isColor ? v.options[sel]?.label : v.options[sel]}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {v.options.map((opt, i) =>
                      isColor ? (
                        <button
                          key={i}
                          type="button"
                          aria-label={opt.label}
                          onClick={() => pickVariant(v.name, i)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            cursor: "pointer",
                            border: `2px solid ${sel === i ? "var(--ink-900)" : "var(--line-200)"}`,
                            padding: 3,
                            background: "#fff",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              background: TINTS[opt.tint][2],
                            }}
                          />
                        </button>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          onClick={() => pickVariant(v.name, i)}
                          style={{
                            minWidth: 56,
                            height: 44,
                            padding: "0 16px",
                            borderRadius: "var(--r-md)",
                            cursor: "pointer",
                            border: `1.5px solid ${sel === i ? "var(--ink-900)" : "var(--line-200)"}`,
                            background: sel === i ? "var(--ink-900)" : "#fff",
                            color: sel === i ? "#fff" : "var(--ink-800)",
                            fontWeight: 700,
                            fontSize: ".9375rem",
                          }}
                        >
                          {opt}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              );
            })}

            {/* Delivery fee — explicit (legal-safe) */}
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                background: "var(--tint-blue-50)",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                fontSize: ".875rem",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="truck" size={16} color="var(--blue-deep)" />
                <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>
                  Rs. {DELIVERY_FEE} delivery fee
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDeliverOpen(true)}
                className="bz-link-hover"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  color: hasDeliveryLoc ? "var(--ink-700)" : "var(--blue)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: ".8125rem",
                }}
              >
                {hasDeliveryLoc ? `to ${formatDeliverToLabel(deliveryLocation)}` : "Set location"}
              </button>
            </div>

            {/* Seller info */}
            {s && (
              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--line-200)",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--ink-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--line-200)",
                  }}
                >
                  {s.avatar ? (
                    <img
                      src={s.avatar}
                      alt={s.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Icon name="store" size={17} color="var(--ink-500)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: ".9375rem",
                      fontWeight: 700,
                      color: "var(--ink-900)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.name}
                  </div>
                  {/* Hide the rating until the seller has real reviews — a "0.0"
                      reads as broken / untrustworthy to an older buyer. */}
                  {(s.reviews ?? 0) > 0 && (
                    <div
                      style={{
                        fontSize: ".75rem",
                        color: "var(--ink-500)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <Icon name="star" size={11} color="var(--gold)" fill="var(--gold)" />
                      {(s.rating ?? 0).toFixed(1)} · {s.reviews} reviews
                    </div>
                  )}
                </div>
                <AppLink
                  href={pathFromScreen("store", s.id)}
                  className="bz-link-hover"
                  style={{
                    fontSize: ".8125rem",
                    fontWeight: 700,
                    color: "var(--blue)",
                    textDecoration: "none",
                  }}
                >
                  Visit store
                </AppLink>
              </div>
            )}
          </div>
        </div>

        <div
          className="bz-stack-900 bz-hide-mobile"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(380px, 1fr)",
            gap: 56,
            alignItems: "start",
          }}
        >
          {/* MEDIA — unified swipeable carousel: photos + optional video. */}
          <div>
            {media.length > 0 ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  background: "var(--ink-50)",
                  touchAction: "pan-y",
                  userSelect: "none",
                }}
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX;
                  touchDelta.current = 0;
                }}
                onTouchMove={(e) => {
                  if (touchStartX.current == null) return;
                  touchDelta.current = e.touches[0].clientX - touchStartX.current;
                }}
                onTouchEnd={() => {
                  if (touchStartX.current == null) return;
                  const dx = touchDelta.current;
                  if (Math.abs(dx) > 40) {
                    setMediaIdx((i) =>
                      Math.max(0, Math.min(media.length - 1, i + (dx < 0 ? 1 : -1))),
                    );
                  }
                  touchStartX.current = null;
                  touchDelta.current = 0;
                }}
                onPointerDown={(e) => {
                  if (e.pointerType === "touch") return;
                  if ((e.target as HTMLElement).closest("button, a")) return;
                  swipeDragging.current = false;
                  touchStartX.current = e.clientX;
                  touchDelta.current = 0;
                }}
                onPointerMove={(e) => {
                  if (e.pointerType === "touch" || touchStartX.current == null) return;
                  touchDelta.current = e.clientX - touchStartX.current;
                  if (!swipeDragging.current && Math.abs(touchDelta.current) > 8) {
                    swipeDragging.current = true;
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }
                }}
                onPointerUp={(e) => {
                  if (e.pointerType === "touch" || touchStartX.current == null) return;
                  const dx = touchDelta.current;
                  if (swipeDragging.current && Math.abs(dx) > 60) {
                    setMediaIdx((i) =>
                      Math.max(0, Math.min(media.length - 1, i + (dx < 0 ? 1 : -1))),
                    );
                  }
                  swipeDragging.current = false;
                  touchStartX.current = null;
                  touchDelta.current = 0;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    transform: `translateX(-${mediaIdx * 100}%)`,
                    transition: "transform .35s ease",
                  }}
                >
                  {media.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        flex: "0 0 100%",
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      {m.type === "photo" ? (
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
                            src={m.src}
                            alt={p.name}
                            draggable={false}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              pointerEvents: "none",
                            }}
                          />
                        </button>
                      ) : (
                        <VideoPlayer
                          tint={p.tint}
                          icon={p.icon}
                          ratio="4 / 5"
                          autoplay={mediaIdx === i}
                          thumb={m.thumb}
                          src={m.src}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {media[mediaIdx]?.type === "photo" && gallery.length > 0 && (
                  <PdpZoomButton onClick={openPhotoLightbox} />
                )}
                {media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMediaIdx((i) => Math.max(0, i - 1))}
                      disabled={mediaIdx === 0}
                      aria-label="Previous media"
                      className="bz-hide-mobile"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 12,
                        transform: "translateY(-50%)",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,.92)",
                        boxShadow: "var(--sh-2)",
                        cursor: mediaIdx === 0 ? "not-allowed" : "pointer",
                        opacity: mediaIdx === 0 ? 0.4 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ink-700)",
                      }}
                    >
                      <Icon name="chevronLeft" size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaIdx((i) => Math.min(media.length - 1, i + 1))}
                      disabled={mediaIdx === media.length - 1}
                      aria-label="Next media"
                      className="bz-hide-mobile"
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: 12,
                        transform: "translateY(-50%)",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(255,255,255,.92)",
                        boxShadow: "var(--sh-2)",
                        cursor: mediaIdx === media.length - 1 ? "not-allowed" : "pointer",
                        opacity: mediaIdx === media.length - 1 ? 0.4 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--ink-700)",
                      }}
                    >
                      <Icon name="chevronRight" size={18} />
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 6,
                        pointerEvents: "none",
                      }}
                    >
                      {media.map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: i === mediaIdx ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            background: i === mediaIdx ? "var(--blue)" : "rgba(0,0,0,.25)",
                            transition: "all .2s",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Placeholder icon={p.icon} tint={p.tint} ratio="4 / 5" radius="var(--r-lg)" />
            )}
            {media.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 12,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {media.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMediaIdx(i)}
                    aria-label={`View media ${i + 1}`}
                    aria-pressed={mediaIdx === i}
                    style={{
                      flex: "0 0 auto",
                      position: "relative",
                      width: 72,
                      height: 88,
                      borderRadius: "var(--r-md)",
                      overflow: "hidden",
                      border: `2px solid ${mediaIdx === i ? "var(--blue)" : "transparent"}`,
                      cursor: "pointer",
                      padding: 0,
                      background: "var(--ink-50)",
                    }}
                  >
                    {m.type === "photo" ? (
                      <img
                        src={m.src}
                        alt={`${p.name} view ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <>
                        {m.thumb && (
                          <img
                            src={m.thumb}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                        <span
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0,0,0,.35)",
                            color: "#fff",
                          }}
                        >
                          <Icon name="video" size={20} color="#fff" />
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="bz-pdp-info" style={{ position: "sticky", top: 96 }}>
            {p.tag && (
              <div style={{ marginBottom: 10 }}>
                <Chip
                  tone={p.tag === "Flash" ? "saffron" : "blue"}
                  icon={p.tag === "Flash" ? "zap" : undefined}
                >
                  {p.tag}
                </Chip>
              </div>
            )}
            <h1
              style={{
                margin: 0,
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "var(--ink-900)",
                lineHeight: 1.25,
              }}
            >
              {p.name}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                margin: "12px 0 6px",
                flexWrap: "wrap",
              }}
            >
              <Price value={p.price} original={p.original} size="lg" />
              {disc > 0 && <Chip tone="red">-{disc}% OFF</Chip>}
            </div>

            {/* Rating — small inline line under price */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: ".8125rem",
                color: "var(--ink-500)",
                marginBottom: 12,
              }}
            >
              <Icon name="star" size={13} color="var(--gold)" fill="var(--gold)" />
              <span style={{ color: "var(--ink-700)", fontWeight: 600 }}>
                {p.rating.toFixed(1)}
              </span>
              <span>({p.reviews})</span>
            </div>

            {/* Delivery — explicit fee block (legal-safe, never hidden) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                marginBottom: 12,
                background: "var(--tint-blue-50)",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontSize: ".875rem",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--ink-700)",
                }}
              >
                <Icon name="truck" size={16} color="var(--blue-deep)" />
                <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>
                  Rs. {DELIVERY_FEE} delivery fee
                </span>
              </div>
              {hasDeliveryLoc ? (
                <button
                  onClick={() => setDeliverOpen(true)}
                  className="bz-link-hover"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    color: "var(--ink-700)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: ".8125rem",
                  }}
                >
                  to {formatDeliverToLabel(deliveryLocation)}
                </button>
              ) : (
                <button
                  onClick={() => setDeliverOpen(true)}
                  className="bz-link-hover"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                    color: "var(--blue)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: ".8125rem",
                  }}
                >
                  Set location
                </button>
              )}
            </div>

            {/* Trust info — returns + COD only; delivery shown above */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 14,
                margin: "0 0 18px",
                fontSize: ".8125rem",
                color: "var(--ink-500)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="returns" size={15} color="var(--ink-400)" /> 7-day returns
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="lock" size={15} color="var(--ink-400)" /> Cash on delivery
              </span>
            </div>
            {p.lowStock && (
              <div style={{ marginBottom: 14 }}>
                <Chip tone="saffron" icon="zap">
                  Hurry — only {p.lowStock} left in stock
                </Chip>
              </div>
            )}

            {/* variants — driven by category profile, not hardcoded */}
            {variants.map((v, vi) => {
              const sel = variantSel[v.name] ?? 0;
              return (
                <div key={v.name} style={{ marginTop: vi === 0 ? 4 : 22 }}>
                  <div
                    style={{
                      fontSize: ".875rem",
                      fontWeight: 700,
                      color: "var(--ink-800)",
                      marginBottom: 10,
                    }}
                  >
                    {v.name}
                    {v.kind === "swatch" && (
                      <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>
                        : {v.options[sel].label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {v.options.map((opt, i) =>
                      v.kind === "swatch" ? (
                        <button
                          key={i}
                          onClick={() => pickVariant(v.name, i)}
                          aria-label={opt.label}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "var(--r-md)",
                            cursor: "pointer",
                            border: `2px solid ${sel === i ? "var(--blue)" : "var(--line-200)"}`,
                            padding: 3,
                            background: "#fff",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                              borderRadius: 5,
                              background: TINTS[opt.tint][2],
                            }}
                          />
                        </button>
                      ) : (
                        <button
                          key={i}
                          onClick={() => pickVariant(v.name, i)}
                          style={{
                            minWidth: 56,
                            height: 46,
                            padding: "0 16px",
                            borderRadius: "var(--r-md)",
                            cursor: "pointer",
                            border: `1.5px solid ${sel === i ? "var(--blue)" : "var(--line-200)"}`,
                            background: sel === i ? "var(--tint-blue-50)" : "#fff",
                            color: sel === i ? "var(--blue)" : "var(--ink-700)",
                            fontWeight: 700,
                            fontSize: ".9375rem",
                          }}
                        >
                          {opt}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quantity row */}
            <div
              style={{
                marginTop: 26,
                paddingTop: 22,
                borderTop: "1px solid var(--line-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span style={{ fontSize: ".9375rem", fontWeight: 700, color: "var(--ink-900)" }}>
                Quantity
              </span>
              <QtyStepper value={qty} onChange={setQty} />
            </div>

            {/* Primary CTAs — above the fold; mobile uses sticky MobileBuyBar */}
            <div className="bz-hide-mobile" style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <Button
                variant="secondary"
                size="lg"
                full
                icon="cart"
                onClick={() => void addToCart(p, qty)}
              >
                Add to Cart
              </Button>
              <Button variant="primary" size="lg" full onClick={() => buyNow(p, qty)}>
                Buy Now
              </Button>
            </div>
            {/* Bargaining — only when the seller enabled it for this product */}
            <div style={{ marginTop: 12 }}>
              {bargainingAvailable ? (
                <Button
                  variant="secondary"
                  full
                  icon="bargain"
                  onClick={() => {
                    if (!authed) {
                      promptLogin("Please sign in to make an offer.");
                      return;
                    }
                    setBargain(true);
                  }}
                >
                  Make an offer
                </Button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 16px",
                    borderRadius: "var(--r-md)",
                    background: "var(--line-50)",
                    color: "var(--ink-500)",
                    fontSize: ".875rem",
                    fontWeight: 600,
                  }}
                >
                  <Icon name="bargain" size={18} color="var(--ink-400)" />
                  Bargaining is not available for this product
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 20,
                fontSize: ".875rem",
                fontWeight: 600,
              }}
            >
              <button
                type="button"
                onClick={() => toggleWish(p.id)}
                className="bz-link-hover"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: wished ? "var(--red)" : "var(--ink-500)",
                  fontWeight: 600,
                  fontSize: ".875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                }}
              >
                <Icon name="heart" size={16} fill={wished ? "currentColor" : "none"} />
                {wished ? "Saved to wishlist" : "Save to wishlist"}
              </button>
              <button
                type="button"
                className="bz-link-hover"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-500)",
                  fontWeight: 600,
                  fontSize: ".875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0,
                }}
              >
                <Icon name="share" size={14} /> Share
              </button>
            </div>

            {/* Seller info — below CTAs; no like/save button (only on store front) */}
            <div style={{ marginTop: 24, paddingTop: 22, borderTop: "1px solid var(--line-200)" }}>
              <div
                style={{
                  fontSize: ".75rem",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--ink-400)",
                  marginBottom: 10,
                }}
              >
                Sold by
              </div>
              <SellerRow seller={s} sellerId={p.seller} onVisit={openStore} />
            </div>
          </div>
        </div>

        {/* Detail sections — desktop: info (L) vs social proof (R); mobile: stacked */}
        <div
          className="bz-pdp-details bz-stack-768"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginTop: 40,
            paddingTop: 28,
            borderTop: "1px solid var(--line-200)",
          }}
        >
          {/* LEFT — product info */}
          <div className="bz-pdp-details__col">
            <TabbedPair
              items={[
                {
                  key: "description",
                  label: "Description",
                  content: desc ? (
                    <>
                      <p
                        style={{
                          color: "var(--ink-500)",
                          lineHeight: 1.7,
                          margin: 0,
                          display: descOpen ? "block" : "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: descOpen ? "unset" : 4,
                          overflow: "hidden",
                        }}
                      >
                        {desc}
                      </p>
                      {desc.length > 240 && (
                        <button
                          onClick={() => setDescOpen((o) => !o)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--blue)",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "8px 0",
                            fontSize: ".875rem",
                          }}
                        >
                          {descOpen ? "Read less" : "Read more"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "var(--ink-400)", margin: 0, fontSize: ".875rem" }}>
                      No description provided.
                    </p>
                  ),
                },
                {
                  key: "specs",
                  label: "Specifications",
                  content:
                    specs.length > 0 ? (
                      <table
                        className="bz-spec-table"
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <tbody>
                          {specs.map(([k, v], i) => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--line-200)" }}>
                              <td
                                style={{
                                  padding: "11px 0",
                                  color: "var(--ink-400)",
                                  fontSize: ".875rem",
                                  width: 180,
                                  verticalAlign: "top",
                                }}
                              >
                                {k}
                              </td>
                              <td
                                style={{
                                  padding: "11px 0",
                                  color: "var(--ink-800)",
                                  fontSize: ".875rem",
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
                      <p style={{ color: "var(--ink-400)", margin: 0, fontSize: ".875rem" }}>
                        No specifications listed.
                      </p>
                    ),
                },
              ]}
            />
          </div>

          {/* RIGHT — social proof */}
          <div className="bz-pdp-details__col bz-pdp-details__col--right">
            <TabbedPair
              items={[
                {
                  key: "reviews",
                  label: "Reviews",
                  content: (
                    <ReviewsSection
                      productId={p.id}
                      rating={p.rating}
                      reviewCount={p.reviews}
                      reviews={reviews}
                      ratingDist={ratingDist}
                      loading={reviewsLoading || ratingLoading}
                    />
                  ),
                },
                {
                  key: "qa",
                  label: "Q&A",
                  content: <QASection productId={p.id} />,
                },
              ]}
            />
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 52, paddingBottom: 100 }}>
            <SectionHead title="Customers also" accent="bought" />
            <div className="bz-picks-grid">
              {related.map((rp) => (
                <ProductCard key={rp.id} p={rp} onClick={openProduct} />
              ))}
            </div>
          </div>
        )}

        {bargain && bargainingAvailable && <BargainModal p={p} onClose={() => setBargain(false)} />}
        {lightboxOpen && gallery.length > 0 && (
          <ImageLightbox
            images={gallery}
            index={photoIndexFromMedia(mediaIdx)}
            alt={p.name}
            onIndex={setMediaFromPhotoIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}

        {/* Mobile sticky buy bar — Buy Now opens an option sheet when the
            product has choices; otherwise it goes straight to checkout. */}
        <MobileBuyBar
          onAdd={() => void addToCart(p, qty)}
          onBuy={() => (variants.length > 0 ? setBuyNowSheet(true) : void buyNow(p, qty))}
        />

        {buyNowSheet && (
          <BuyNowSheet
            p={p}
            variants={variants}
            variantSel={variantSel}
            onPick={pickVariant}
            onConfirm={() => {
              setBuyNowSheet(false);
              void buyNow(p, qty);
            }}
            onClose={() => setBuyNowSheet(false)}
          />
        )}

        {/* Delivery-location picker (opened from the delivery line) */}
        <DeliverToModal
          open={deliverOpen}
          value={deliveryLocation}
          onClose={() => setDeliverOpen(false)}
          onSave={(loc) => {
            setDeliveryLocation(loc);
            setDeliverOpen(false);
            toast(`Delivering to ${formatDeliverToLabel(loc)}`);
          }}
        />
      </div>
    </ApiState>
  );
}
