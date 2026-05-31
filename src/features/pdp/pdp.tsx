"use client";
// @ts-nocheck — legacy design prototype; typed incrementally

import React, { useState } from "react";
import {
  Icon,
  Logo,
  Button,
  Spinner,
  IconButton,
  RatingStars,
  Chip,
  VerifiedBadge,
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
  HelpLifeline,
  AllInPriceCard,
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
} from "@/components/ui";
import {
  useCatalog,
  useProductReviews,
  useProductProfile,
  useRatingDistribution,
  useSeller,
} from "@/hooks/use-catalog";
import { isSellerUser } from "@/lib/auth-rbac";
import { useBazaarStore } from "@/store/bazaar-store";
import {
  BazaarCtx,
  useBz,
  Himalaya,
  KathmanduSkyline,
  ProductCard,
  ProductRail,
  CategoryTile,
  Navbar,
  Footer,
  DevViewSwitcher,
} from "@/components/common";
import type { PdpProps } from "@/types";

/* ============================================================
   BazaarCo — Product Detail Page (video-led)
   ============================================================ */
function BargainModal({ p, onClose }) {
  const { addToCart, toast } = useBz();
  const { sellerOf } = useCatalog();
  const [offer, setOffer] = useState(Math.round((p.price * 0.9) / 10) * 10);
  const [stage, setStage] = useState("offer"); // offer | thinking | counter | accepted
  const floor = Math.round(p.price * 0.85);
  const counter = Math.round((p.price * 0.93) / 10) * 10;
  const submit = () => {
    setStage("thinking");
    setTimeout(() => {
      setStage(offer >= floor ? "accepted" : "counter");
    }, 1400);
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
              <Button variant="blue" full size="lg" onClick={submit}>
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
                onClick={() => {
                  addToCart({ ...p, price: offer }, 1);
                  toast("Added at bargained price!");
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
                variant="ghost"
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
                onClick={() => {
                  addToCart({ ...p, price: counter }, 1);
                  toast("Deal! Added to cart.");
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

export function PDP({ p }: PdpProps) {
  const { addToCart, buyNow, openProduct, toggleWish, wish, toast, nav } = useBz();
  const user = useBazaarStore((s) => s.user);
  const authed = useBazaarStore((s) => s.authed);
  const sellerView = authed && isSellerUser(user);
  const deliveryLocation = useBazaarStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useBazaarStore((s) => s.setDeliveryLocation);
  const cart = useBazaarStore((s) => s.cart);
  const inCart = cart.some((item) => item.id === p.id);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const catalog = useCatalog();
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(p.id);
  const { data: profile, isLoading: profileLoading } = useProductProfile(p.id);
  const { data: ratingDist = [], isLoading: ratingLoading } = useRatingDistribution(p.id);
  const isLoading = catalog.isLoading || reviewsLoading || profileLoading || ratingLoading;
  const isError = catalog.isError;
  const error = catalog.error;
  const { products, categories, sellerOf } = catalog;
  const sellerKey = p.seller ?? (p as { sellerId?: string }).sellerId;
  const sellerFromCatalog = sellerOf(p);
  const { data: sellerById } = useSeller(sellerKey && !sellerFromCatalog ? sellerKey : null);
  const s = sellerFromCatalog ?? sellerById;
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id);
  const { variants = [], specs = [], desc = "" } = profile ?? {};
  const [tab, setTab] = useState(p.hasVideo ? "video" : "photos");
  const [photoIdx, setPhotoIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [bargain, setBargain] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [shown, setShown] = useState(5);
  const [variantSel, setVariantSel] = useState(() =>
    Object.fromEntries((profile?.variants ?? []).map((v) => [v.name, v.default || 0])),
  );
  const disc = p.original ? Math.round((1 - p.price / p.original) * 100) : 0;
  const wished = wish.includes(p.id);
  const pickVariant = (name, i) => setVariantSel((prev) => ({ ...prev, [name]: i }));

  const tabs = [["photos", "Photos", "image"], p.hasVideo && ["video", "Video", "video"]].filter(
    Boolean,
  );

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 0" }}>
        {/* breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: ".8125rem",
            color: "var(--ink-400)",
            marginBottom: 18,
          }}
        >
          <span className="bz-crumb" onClick={() => nav("home")}>
            Home
          </span>
          <Icon name="chevronRight" size={13} color="var(--ink-300)" />
          <span className="bz-crumb" onClick={() => nav("browse")}>
            {(categories ?? []).find((c) => c.id === p.cat)?.en}
          </span>
          <Icon name="chevronRight" size={13} color="var(--ink-300)" />
          <span style={{ color: "var(--ink-700)" }}>{p.name}</span>
        </div>

        <div
          className="bz-stack-900"
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* MEDIA */}
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {tabs.map(([id, label, icon]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 16px",
                    borderRadius: "var(--r-md)",
                    border: `1.5px solid ${tab === id ? "var(--blue)" : "var(--line-200)"}`,
                    cursor: "pointer",
                    background: tab === id ? "var(--tint-blue-50)" : "#fff",
                    color: tab === id ? "var(--blue)" : "var(--ink-500)",
                    fontWeight: 700,
                    fontSize: ".875rem",
                  }}
                >
                  <Icon name={icon} size={16} /> {label}{" "}
                  {id === "video" && (
                    <span
                      style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }}
                    />
                  )}
                </button>
              ))}
            </div>
            {tab === "video" && (
              <VideoPlayer
                tint={p.tint}
                icon={p.icon}
                ratio="4 / 5"
                autoplay
                thumb={p.videoThumb}
                src={p.videoUrl}
                overlay={
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      background: "rgba(255,255,255,.95)",
                      borderRadius: "var(--r-md)",
                      padding: "8px 12px",
                      boxShadow: "var(--sh-2)",
                    }}
                  >
                    <div style={{ fontSize: ".6875rem", color: "var(--ink-400)", fontWeight: 600 }}>
                      In this video
                    </div>
                    <Price value={p.price} size="sm" />
                  </div>
                }
              />
            )}
            {tab === "photos" && (
              <div>
                {p.img ? (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 5",
                      borderRadius: "var(--r-lg)",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={p.img}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <Placeholder icon={p.icon} tint={p.tint} ratio="4 / 5" radius="var(--r-lg)" />
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      style={{
                        width: 72,
                        height: 88,
                        borderRadius: "var(--r-md)",
                        overflow: "hidden",
                        border: `2px solid ${photoIdx === i ? "var(--blue)" : "transparent"}`,
                        cursor: "pointer",
                        padding: 0,
                        background: "none",
                      }}
                    >
                      {p.img && i === 0 ? (
                        <img
                          src={p.img}
                          alt={`${p.name} view ${i + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Placeholder
                          icon={p.icon}
                          tint={[p.tint, "slate", "gold", "blue"][i]}
                          ratio="72 / 88"
                          radius="0"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* INFO */}
          <div style={{ position: "sticky", top: 96 }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0" }}>
              <Price value={p.price} original={p.original} size="lg" />
              {disc > 0 && <Chip tone="red">-{disc}% OFF</Chip>}
            </div>

            {/* All-in pricing card (guide §3.6) */}
            <div style={{ marginBottom: 14 }}>
              <AllInPriceCard
                price={p.price}
                delivery={p.price >= 1000 ? 0 : 80}
                area={deliveryLocation.area || deliveryLocation.city}
                onEditArea={() => setDeliverOpen(true)}
              />
            </div>

            {/* trust row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "center",
                padding: "14px 0",
                borderTop: "1px solid var(--line-200)",
                borderBottom: "1px solid var(--line-200)",
              }}
            >
              <RatingStars value={p.rating} size={16} showVal count={p.reviews} />
              {s?.name && (
                <>
                  <span style={{ width: 1, height: 16, background: "var(--line-200)" }} />
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontWeight: 700,
                      fontSize: ".875rem",
                      color: "var(--ink-700)",
                    }}
                  >
                    <Icon name="badgeCheck" size={17} color="var(--gold)" /> {s.name}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
              <Chip tone="blue" icon="truck">
                Delivered by {p.eta}
              </Chip>
              <Chip tone="success" icon="returns">
                7-day returns
              </Chip>
              <Chip tone="neutral" icon="lock">
                Cash on delivery
              </Chip>
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
                <div key={v.name} style={{ marginTop: vi === 0 ? 6 : 18 }}>
                  <div
                    style={{
                      fontSize: ".8125rem",
                      fontWeight: 700,
                      color: "var(--ink-700)",
                      marginBottom: 8,
                    }}
                  >
                    {v.name}
                    {v.kind === "swatch" && (
                      <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>
                        : {v.options[sel].label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {v.options.map((opt, i) =>
                      v.kind === "swatch" ? (
                        <button
                          key={i}
                          onClick={() => pickVariant(v.name, i)}
                          aria-label={opt.label}
                          style={{
                            width: 44,
                            height: 44,
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
                            minWidth: 48,
                            height: 44,
                            padding: "0 14px",
                            borderRadius: "var(--r-full)",
                            cursor: "pointer",
                            border: `2px solid ${sel === i ? "var(--blue)" : "var(--line-200)"}`,
                            background: sel === i ? "var(--tint-blue-50)" : "#fff",
                            color: sel === i ? "var(--blue)" : "var(--ink-700)",
                            fontWeight: 700,
                            fontSize: ".875rem",
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
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)" }}>
                Quantity
              </span>
              <QtyStepper value={qty} onChange={setQty} />
            </div>

            {sellerView ? (
              <div
                style={{
                  marginTop: 22,
                  padding: 18,
                  background: "var(--tint-blue-50)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--line-200)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Icon name="store" size={22} color="var(--blue)" />
                  <span style={{ fontWeight: 800, color: "var(--blue-deep)" }}>Seller preview</span>
                </div>
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: ".875rem",
                    color: "var(--ink-600)",
                    lineHeight: 1.55,
                  }}
                >
                  You are signed in as a <b>seller</b>. Buyers see Add to cart and Buy now here —
                  use your seller tools to manage listings.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button
                    variant="primary"
                    size="lg"
                    icon="store"
                    onClick={() => nav("s-dashboard")}
                  >
                    Seller dashboard
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => nav("s-products")}>
                    My products
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginTop: 22 }}>
                  <Button
                    variant="secondary"
                    full
                    size="lg"
                    icon="bargain"
                    onClick={() => setBargain(true)}
                  >
                    Make an offer
                  </Button>
                </div>
                <div className="bz-hide-mobile bz-pdp-buy-actions">
                  <Button
                    variant="secondary"
                    size="lg"
                    full
                    icon="cart"
                    onClick={() => {
                      addToCart(p, qty);
                      toast(`${qty} added to cart`);
                    }}
                  >
                    Add to Cart
                  </Button>
                  <Button variant="primary" size="lg" full onClick={() => buyNow(p, qty)}>
                    Buy Now
                  </Button>
                </div>
                <button
                  onClick={() => toggleWish(p.id)}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    height: 40,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: wished ? "var(--red)" : "var(--ink-500)",
                    fontWeight: 600,
                    fontSize: ".875rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="heart" size={18} fill={wished ? "currentColor" : "none"} />{" "}
                  {wished ? "Saved to wishlist" : "Save to wishlist"}
                  <span
                    style={{ width: 1, height: 16, background: "var(--line-200)", margin: "0 4px" }}
                  />
                  <Icon name="share" size={16} /> Share
                </button>
              </>
            )}
          </div>
        </div>

        {/* lower sections */}
        <div
          className="bz-stack-900"
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: 40,
            marginTop: 48,
            alignItems: "start",
          }}
        >
          <div>
            {/* description */}
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 12 }}>Description</h3>
            <p
              style={{
                color: "var(--ink-500)",
                lineHeight: 1.7,
                margin: 0,
                maxHeight: descOpen ? "none" : 72,
                overflow: "hidden",
              }}
            >
              {desc}
            </p>
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

            {/* specs */}
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "24px 0 12px" }}>
              Specifications
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {specs.map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line-200)" }}>
                    <td
                      style={{
                        padding: "11px 0",
                        color: "var(--ink-400)",
                        fontSize: ".875rem",
                        width: 160,
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
          </div>

          {/* reviews — customer photos first per guide §3.6 */}
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 14 }}>
              Customer photos & reviews
            </h3>
            {reviews.some((r) => r.photos > 0) ? (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: ".8125rem",
                    fontWeight: 700,
                    color: "var(--ink-500)",
                    marginBottom: 8,
                  }}
                >
                  Real photos from buyers
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {reviews.flatMap((r, ri) =>
                    Array.from({ length: r.photos }).map((_, j) => (
                      <Placeholder
                        key={`${ri}-${j}`}
                        icon={p.icon}
                        tint={[p.tint, "slate", "gold", "blue"][(ri + j) % 4]}
                        style={{ width: 80, height: 80 }}
                        radius="var(--r-sm)"
                      />
                    )),
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--tint-blue-50)",
                  padding: 14,
                  borderRadius: "var(--r-md)",
                  fontSize: ".875rem",
                  color: "var(--blue-deep)",
                  marginBottom: 18,
                }}
              >
                <Icon
                  name="shieldCheck"
                  size={18}
                  color="var(--blue-deep)"
                  style={{ verticalAlign: "middle", marginRight: 6 }}
                />
                No customer photos yet — shop safely with our 100% return policy.
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 24,
                padding: 18,
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div
                  className="tnum bz-hero-h2"
                  style={{ fontWeight: 800, color: "var(--blue-deep)", lineHeight: 1 }}
                >
                  {p.rating.toFixed(1)}
                </div>
                <RatingStars value={p.rating} size={14} />
                <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 4 }}>
                  {p.reviews} reviews
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {ratingDist.map((r) => (
                  <div
                    key={r.s}
                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}
                  >
                    <span
                      className="tnum"
                      style={{ fontSize: ".75rem", color: "var(--ink-400)", width: 10 }}
                    >
                      {r.s}
                    </span>
                    <Icon name="star" size={11} color="var(--gold)" fill="var(--gold)" />
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "var(--line-100)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{ width: `${r.pct}%`, height: "100%", background: "var(--gold)" }}
                      />
                    </div>
                    <span
                      className="tnum"
                      style={{
                        fontSize: ".75rem",
                        color: "var(--ink-400)",
                        width: 28,
                        textAlign: "right",
                      }}
                    >
                      {r.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {reviews.map((r, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: 14,
                    borderBottom: i < reviews.length - 1 ? "1px solid var(--line-200)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "1.5px solid var(--line-200)",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={r.avatar}
                        alt={r.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".875rem" }}>{r.name}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
                        {r.city} · {r.date}
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <RatingStars value={r.rating} size={12} />
                    </div>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--ink-600)",
                      fontSize: ".875rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {r.text}
                  </p>
                  {r.photoUrls && r.photoUrls.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {r.photoUrls.map((url, j) => (
                        <div
                          key={j}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "var(--r-sm)",
                            overflow: "hidden",
                            border: "1px solid var(--line-200)",
                          }}
                        >
                          <img
                            src={url}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <Button variant="secondary" full>
                View all {p.reviews} reviews
              </Button>
            </div>
          </div>
        </div>

        {/* Q&A */}
        <div style={{ marginTop: 52 }}>
          <SectionHead title="Questions & answers" />
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 20,
            }}
          >
            {[
              {
                q: "Is this genuine pashmina or blended?",
                a: "100% genuine Himalayan pashmina — certified by the seller. We refund full if the test fails.",
                by: "Himalayan Handlooms · 3 days ago",
              },
              {
                q: "Can I bargain on the price?",
                a: "Yes. Tap 'Make an offer' on this page — sellers usually reply within minutes.",
                by: "BazaarCo Team · 1 week ago",
              },
            ].map((it, i) => (
              <div
                key={i}
                style={{
                  borderBottom: i === 0 ? "1px solid var(--line-200)" : "none",
                  padding: i === 0 ? "0 0 16px" : "16px 0 0",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--tint-blue-50)",
                      color: "var(--blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    Q
                  </span>
                  <div style={{ fontWeight: 700 }}>{it.q}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(22,163,74,.12)",
                      color: "var(--success)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    A
                  </span>
                  <div>
                    <div style={{ color: "var(--ink-700)", fontSize: ".9375rem" }}>{it.a}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 4 }}>
                      {it.by}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 18 }}>
              <Button variant="secondary" full icon="headphones">
                Ask a question
              </Button>
            </div>
          </div>
        </div>

        {/* related */}
        <div style={{ marginTop: 52, paddingBottom: 100 }}>
          <SectionHead title="Customers also" accent="bought" />
          <ProductRail items={related.slice(0, shown)} onOpen={openProduct} cols={5} />
          {shown < related.length && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <Button variant="secondary" onClick={() => setShown((n) => n + 5)}>
                Load more · {related.length - shown} more
              </Button>
            </div>
          )}
        </div>

        {bargain && !sellerView && <BargainModal p={p} onClose={() => setBargain(false)} />}

        <DeliverToModal
          open={deliverOpen}
          value={deliveryLocation}
          onClose={() => setDeliverOpen(false)}
          onSave={(loc) => {
            setDeliveryLocation(loc);
            setDeliverOpen(false);
            toast(`Delivering to ${loc.area}, ${loc.city}`);
          }}
        />

        {!sellerView && !inCart && (
          <MobileBuyBar
            onAdd={() => {
              addToCart(p, qty);
              toast(`${qty} added to cart`);
            }}
            onBuy={() => buyNow(p, qty)}
          />
        )}
      </div>
    </ApiState>
  );
}
