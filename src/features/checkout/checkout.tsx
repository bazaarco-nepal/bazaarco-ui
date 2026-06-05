// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Icon,
  Logo,
  AppLink,
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
  AllInPriceCard,
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
} from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useAddresses, pickDefaultAddress } from "@/hooks/use-addresses";
import { SavedAddressPicker } from "@/features/profile/addresses";
import {
  ADDRESS_LABEL_PRESETS,
  isAddressComplete,
  savedAddressToDelivery,
} from "@/lib/saved-address";
import {
  DEFAULT_DELIVERY,
  isDeliverableCity,
  DELIVERY_AREA_MESSAGE,
} from "@/lib/delivery-location";
import { useBazaarStore } from "@/store/bazaar-store";
import { queryKeys } from "@/services/api/query-keys";
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
import { pathFromScreen } from "@/config/routes";
import { resolveDelivery, deliveryChoices, distinctSellerCount } from "@/lib/delivery-options";
import {
  selectedLines,
  allSelected,
  isLineSelected,
  toggleLine,
  toggleAll,
} from "@/lib/cart-selection";

export function priceBreakdown(cart, deliveryTier = "standard") {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  // Launch delivery pricing: a flat tier fee (Standard/Premium), auto-combined
  // when the cart spans 2+ sellers. No more free-over-Rs1000 threshold.
  const resolved = resolveDelivery(cart, deliveryTier);
  const delivery = subtotal === 0 ? 0 : resolved.fee;
  const discount = 0;
  return {
    subtotal,
    delivery,
    discount,
    total: subtotal + delivery - discount,
    deliveryLabel: resolved.label,
    deliveryType: resolved.type,
    combined: resolved.combined,
  };
}
function Row({ label, value, strong, free, color }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: strong ? "14px 0 0" : "7px 0",
        borderTop: strong ? "1px solid var(--line-200)" : "none",
        marginTop: strong ? 6 : 0,
      }}
    >
      <span
        style={{
          fontSize: strong ? "1rem" : ".875rem",
          fontWeight: strong ? 700 : 500,
          color: strong ? "var(--ink-900)" : "var(--ink-500)",
        }}
      >
        {label}
      </span>
      <span
        className="tnum"
        style={{
          fontSize: strong ? "1.25rem" : ".9375rem",
          fontWeight: strong ? 800 : 600,
          color: color || (strong ? "var(--blue-deep)" : "var(--ink-800)"),
        }}
      >
        {free ? "Free" : `Rs. ${value.toLocaleString("en-IN")}`}
      </span>
    </div>
  );
}

/* ---------- DELIVERY OPTION PICKER ---------- */
function DeliveryOptionPicker({ cart, tier, onChange }) {
  const choices = deliveryChoices(cart);
  const combined = choices[0]?.combined;
  const sellerCount = distinctSellerCount(cart);
  return (
    <div
      style={{
        marginTop: 14,
        background: "#fff",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 4,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 700 }}>Delivery option</div>
        {combined && (
          <Chip tone="blue" size="sm" icon="package">
            Combined · {sellerCount} sellers
          </Chip>
        )}
      </div>
      <div style={{ fontSize: ".8125rem", color: "var(--ink-400)", marginBottom: 14 }}>
        {combined
          ? "Your cart has items from 2+ sellers, so combined delivery pricing applies."
          : "Kathmandu Valley · delivery times are estimates, not guarantees."}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {choices.map((c) => {
          const selected = c.tier === tier;
          return (
            <button
              key={c.tier}
              type="button"
              onClick={() => onChange(c.tier)}
              style={{
                textAlign: "left",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: 14,
                borderRadius: "var(--r-md)",
                border: `1.5px solid ${selected ? "var(--blue)" : "var(--line-200)"}`,
                background: selected ? "var(--tint-blue-50)" : "#fff",
                cursor: "pointer",
                width: "100%",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `2px solid ${selected ? "var(--blue)" : "var(--ink-400)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {selected && (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--blue)",
                    }}
                  />
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: ".9375rem", color: "var(--ink-900)" }}>
                    {c.label}
                  </span>
                  <span
                    className="tnum"
                    style={{ fontWeight: 800, color: "var(--blue-deep)", whiteSpace: "nowrap" }}
                  >
                    Rs.&nbsp;{c.fee.toLocaleString("en-IN")}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                    marginTop: 4,
                    lineHeight: 1.45,
                  }}
                >
                  {c.promise}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p
        style={{
          fontSize: ".75rem",
          color: "var(--ink-400)",
          margin: "12px 0 0",
          lineHeight: 1.5,
        }}
      >
        Delivery times are estimates, not a promise. The exact day can change with the weather,
        traffic, and how quickly the seller packs your order.
      </p>
    </div>
  );
}

/* ---------- CART ---------- */
export function Cart() {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    nav,
    openProduct,
    toast,
    cartLoading,
    authed,
    promptLogin,
  } = useBz();
  const { sellerOf } = useCatalog();
  const deliveryTier = useBazaarStore((s) => s.deliveryTier);
  const [coupon, setCoupon] = useState("");
  const [confirm, setConfirm] = useState(null);
  const bd = priceBreakdown(cart, deliveryTier);
  const setQty = (id, q) => {
    void updateCartQty(id, q);
  };
  const remove = (id) => {
    void removeFromCart(id).then(() => {
      setConfirm(null);
      toast("Removed from cart");
    });
  };
  const applyCoupon = () => {
    if (coupon.trim()) toast("Coupons coming soon");
  };

  if (cartLoading && cart.length === 0) {
    return (
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "40px 28px",
          textAlign: "center",
          color: "var(--ink-500)",
        }}
      >
        Loading your cart…
      </div>
    );
  }

  if (cart.length === 0)
    return (
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px" }}>
        <EmptyState
          title="Your cart is empty"
          message="Looks like you haven't added anything yet. Let's find something you'll love."
          cta="Browse products"
          ctaHref={pathFromScreen("browse")}
          secondary="Watch"
          secondaryHref={pathFromScreen("video")}
        />
      </div>
    );

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 0" }}>
      <AppLink
        href={pathFromScreen("home")}
        className="bz-show-mobile bz-show-mobile--flex"
        style={{
          display: "none",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
          color: "var(--blue)",
          fontWeight: 700,
          fontSize: ".9375rem",
          textDecoration: "none",
        }}
      >
        <Icon name="chevronLeft" size={16} /> Continue shopping
      </AppLink>
      {/* Mobile: plain text-only page title, matching the "My orders" header. */}
      <h1
        className="bz-show-mobile"
        style={{
          display: "none",
          margin: "0 0 24px",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        My cart
      </h1>
      <h1
        className="bz-hide-mobile"
        style={{
          margin: "0 0 8px",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Your cart{" "}
        <span
          className="tnum"
          style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: "1rem" }}
        >
          · {cart.length} item{cart.length > 1 ? "s" : ""}
        </span>
      </h1>
      <div style={{ height: 8 }} />
      <div
        className="bz-stack-900"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 32,
          alignItems: "start",
          marginTop: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {cart.map((it) => {
            const s = sellerOf(it);
            return (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  gap: 16,
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 16,
                }}
              >
                <AppLink
                  href={pathFromScreen("pdp", it.id)}
                  onNavigate={() => openProduct(it)}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                >
                  {it.img ? (
                    <img
                      src={it.img}
                      alt={it.name}
                      style={{
                        width: 96,
                        height: 96,
                        objectFit: "cover",
                        borderRadius: "var(--r-md)",
                      }}
                    />
                  ) : (
                    <Placeholder
                      icon={it.icon}
                      tint={it.tint}
                      style={{ width: 96, height: 96 }}
                      radius="var(--r-md)"
                    />
                  )}
                </AppLink>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <AppLink
                      href={pathFromScreen("pdp", it.id)}
                      onNavigate={() => openProduct(it)}
                      style={{ cursor: "pointer", textDecoration: "none" }}
                    >
                      <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>{it.name}</div>
                      <div
                        style={{
                          fontSize: ".75rem",
                          color: "var(--ink-400)",
                          marginTop: 3,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="badgeCheck" size={13} color="var(--gold)" /> {s?.name}
                      </div>
                      {it.coupon && (
                        <div style={{ marginTop: 6 }}>
                          <Chip tone="success" size="sm" icon="tag">
                            Coupon applied
                          </Chip>
                        </div>
                      )}
                    </AppLink>
                    <Price value={it.price} size="sm" />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 12,
                    }}
                  >
                    <QtyStepper value={it.qty} onChange={(q) => setQty(it.id, q)} />
                    <button
                      onClick={() => setConfirm(it)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        cursor: "pointer",
                        fontSize: ".8125rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Icon name="x" size={15} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* summary */}
        <div
          style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Order summary</div>
            <details style={{ marginBottom: 12 }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--blue)",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  listStyle: "none",
                }}
              >
                + Have a promo code?
              </summary>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  style={{
                    flex: 1,
                    height: 40,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: "0 12px",
                    fontSize: ".875rem",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Button variant="secondary" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
            </details>
            <Row label="Subtotal" value={bd.subtotal} />
            <Row label="Delivery" value={bd.delivery} />
            {bd.discount > 0 && (
              <Row label="Discount (10%)" value={bd.discount} color="var(--success)" />
            )}
            <Row label="Total" value={bd.total} strong />
            <div
              style={{
                fontSize: ".75rem",
                color: "var(--ink-400)",
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon name="truck" size={13} color="var(--ink-400)" /> Choose Standard or Premium
              same-day at checkout
            </div>
            <div style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                full
                size="lg"
                iconRight="arrowRight"
                onClick={() => {
                  if (authed) nav("checkout");
                  else promptLogin("Please sign in to complete checkout.");
                }}
              >
                Checkout
              </Button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 12,
                color: "var(--ink-400)",
                fontSize: ".75rem",
              }}
            >
              <Icon name="lock" size={13} color="var(--ink-400)" /> Secure checkout · cash on
              delivery
            </div>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title="Remove item?"
          message={`Remove "${confirm.name}" from your cart?`}
          confirmLabel="Remove"
          onConfirm={() => remove(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(11,18,32,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "var(--r-xl)", width: 400, padding: 26 }}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: "1.125rem" }}>{title}</h3>
        <p style={{ margin: "0 0 22px", color: "var(--ink-500)", fontSize: ".9375rem" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary" full onClick={onCancel}>
            Keep
          </Button>
          <Button variant="danger" full onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section card (collapsible) ---------- */
function CheckoutSection({ n, title, summary, complete, open, onToggle, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${open ? "var(--blue)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        transition: "border-color var(--dur-standard) var(--ease)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "none",
          border: "none",
          padding: "18px 20px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: complete ? "var(--success)" : open ? "var(--blue)" : "var(--line-100)",
            color: complete || open ? "#fff" : "var(--ink-400)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {complete ? <Icon name="check" size={18} color="#fff" /> : n}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--ink-900)" }}>{title}</div>
          {summary && !open && (
            <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 3 }}>
              {summary}
            </div>
          )}
        </div>
        <Icon
          name="chevronDown"
          size={20}
          color="var(--ink-400)"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform var(--dur-standard)",
          }}
        />
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}

function isValidNpPhone(digits) {
  return /^9[678]\d{8}$/.test(digits.replace(/\D/g, ""));
}

/* ---------- CHECKOUT (single page, 3 collapsed sections) ---------- */
export function Checkout() {
  const { cart, nav, placeOrder } = useBz();
  const queryClient = useQueryClient();
  const authed = useBazaarStore((s) => s.authed);
  const buyerPhone = useBazaarStore((s) => s.buyerPhone);
  const setBuyerPhone = useBazaarStore((s) => s.setBuyerPhone);
  const deliveryTier = useBazaarStore((s) => s.deliveryTier);
  const setDeliveryTier = useBazaarStore((s) => s.setDeliveryTier);
  const { data: savedAddresses = [] } = useAddresses(authed);
  const [openSec, setOpenSec] = useState(0);
  // Phone is shared with the profile — prefill from there, and saving the order
  // writes it back so the profile stays in sync.
  const [phone, setPhone] = useState(buyerPhone);
  // No fake prefill: the buyer must enter / pick a real address, never a guessed one.
  const [address, setAddress] = useState({ ...DEFAULT_DELIVERY, landmark: "" });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  // First-ever address auto-saves to the book; an extra address defaults to save too.
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [loading, setLoading] = useState(false);
  const bd = priceBreakdown(cart, deliveryTier);
  const total = bd.total;
  const pay = "cod";

  // When there are no saved addresses, the buyer is entering their first one.
  const enteringNewAddress = useNewAddress || !savedAddresses.length;
  const mustSaveNewAddress = authed && !savedAddresses.length;
  const shouldSaveNewAddress = mustSaveNewAddress || saveNewAddress;

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneComplete = isValidNpPhone(phoneDigits);
  const addressComplete = isAddressComplete(address);
  // We currently deliver only inside Kathmandu — block anything else.
  const addressDeliverable = isDeliverableCity(address.city);
  const canPlaceOrder = phoneComplete && addressComplete && addressDeliverable;

  // Late hydration of the saved phone — prefill only while the field is untouched.
  useEffect(() => {
    if (buyerPhone && !phone) setPhone(buyerPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerPhone]);

  useEffect(() => {
    if (!authed || !savedAddresses.length || selectedAddressId || useNewAddress) return;
    const def = pickDefaultAddress(savedAddresses);
    if (def) {
      setSelectedAddressId(def.id);
      setAddress(savedAddressToDelivery(def));
    }
  }, [authed, savedAddresses, selectedAddressId, useNewAddress]);

  const submit = async () => {
    if (!canPlaceOrder) return;
    setLoading(true);
    try {
      // Persist the phone back to the shared store so it shows up in the profile.
      setBuyerPhone(phoneDigits);
      const payload = {
        phone: phoneDigits,
        paymentMethod: "cod",
        deliveryTier,
        addressId: !enteringNewAddress && selectedAddressId ? selectedAddressId : undefined,
        deliveryAddress: {
          city: address.city.trim(),
          area: address.area.trim(),
          landmark: (address.landmark ?? "").trim(),
        },
        saveAddress:
          authed && enteringNewAddress && shouldSaveNewAddress
            ? {
                label: newAddressLabel.trim() || "Home",
                isDefault: savedAddresses.length === 0,
              }
            : undefined,
      } as const;
      await placeOrder(payload);
      if (payload.saveAddress) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
      }
    } catch {
      /* toast shown in provider */
    } finally {
      setLoading(false);
    }
  };

  const payLabel = "Place order";

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 80px" }}>
      <AppLink
        href={pathFromScreen("cart")}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-500)",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
          fontSize: ".875rem",
          textDecoration: "none",
        }}
      >
        <Icon name="chevronLeft" size={16} /> Back to cart
      </AppLink>

      <h1
        style={{
          margin: "0 0 4px",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Checkout
      </h1>
      <p style={{ margin: "0 0 20px", color: "var(--ink-500)", fontSize: ".9375rem" }}>
        Three quick steps. No emails, no passwords.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <CheckoutSection
          n={1}
          title="Phone number"
          summary={phoneComplete ? `+977 ${phoneDigits}` : "Add your mobile for delivery updates"}
          complete={phoneComplete}
          open={openSec === 0}
          onToggle={() => setOpenSec(openSec === 0 ? -1 : 0)}
        >
          <label style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
            Mobile number
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: ".9375rem",
                color: "var(--ink-700)",
                flexShrink: 0,
              }}
            >
              +977
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98XXXXXXXX"
              style={{
                flex: 1,
                height: 48,
                border: `1.5px solid ${phoneComplete || !phoneDigits ? "var(--line-200)" : "var(--danger)"}`,
                borderRadius: "var(--r-md)",
                padding: "0 14px",
                fontSize: "1rem",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
          {phoneDigits.length > 0 && !phoneComplete && (
            <p
              style={{
                fontSize: ".8125rem",
                color: "var(--danger)",
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Enter a valid 10-digit Nepal mobile (e.g. 98XXXXXXXX).
            </p>
          )}
          <p
            style={{
              fontSize: ".8125rem",
              color: "var(--ink-400)",
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            Used for order updates and delivery calls. We will not share it with sellers.
          </p>
          <div style={{ marginTop: 14 }}>
            <Button
              variant="primary"
              full
              onClick={() => {
                setBuyerPhone(phoneDigits);
                setOpenSec(1);
              }}
              disabled={!phoneComplete}
            >
              Continue
            </Button>
          </div>
        </CheckoutSection>

        <CheckoutSection
          n={2}
          title="Delivery address"
          summary={
            addressComplete
              ? `${address.area}, ${address.city} · ${address.landmark}`
              : "Set your delivery address"
          }
          complete={addressComplete}
          open={openSec === 1}
          onToggle={() => setOpenSec(openSec === 1 ? -1 : 1)}
        >
          {authed && savedAddresses.length > 0 && (
            <SavedAddressPicker
              addresses={savedAddresses}
              selectedId={selectedAddressId}
              useNew={useNewAddress}
              onSelect={(addr) => {
                setSelectedAddressId(addr.id);
                setUseNewAddress(false);
                setSaveNewAddress(false);
                setAddress(savedAddressToDelivery(addr));
              }}
              onUseNew={() => {
                setUseNewAddress(true);
                setSelectedAddressId(null);
                setAddress({ ...DEFAULT_DELIVERY, city: "Kathmandu", area: "", landmark: "" });
              }}
              onManage={() => nav("addresses")}
            />
          )}

          {(enteringNewAddress || !authed) && (
            <>
              {authed && !savedAddresses.length && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                    lineHeight: 1.45,
                  }}
                >
                  Add at least one delivery address to continue. We&apos;ll save it to your profile
                  so next time it&apos;s one tap.
                </p>
              )}
              <LandmarkAddress value={address} onChange={setAddress} />
              {authed && enteringNewAddress && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginTop: 14,
                    fontSize: ".875rem",
                    color: "var(--ink-700)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={shouldSaveNewAddress}
                    disabled={mustSaveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--blue)" }}
                  />
                  <span>
                    {mustSaveNewAddress
                      ? "Save this first address to my profile"
                      : "Save to my addresses for next time"}
                    {shouldSaveNewAddress && (
                      <span style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {ADDRESS_LABEL_PRESETS.map((label) => {
                            const active = newAddressLabel === label;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setNewAddressLabel(label)}
                                style={{
                                  border: `1.5px solid ${
                                    active ? "var(--blue)" : "var(--line-200)"
                                  }`,
                                  background: active ? "var(--tint-blue-50)" : "#fff",
                                  color: active ? "var(--blue)" : "var(--ink-600)",
                                  borderRadius: "999px",
                                  padding: "7px 12px",
                                  fontSize: ".8125rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </span>
                        <input
                          value={newAddressLabel}
                          onChange={(e) => setNewAddressLabel(e.target.value)}
                          placeholder="Label (Home, Office…)"
                          style={{
                            width: "100%",
                            height: 40,
                            border: "1.5px solid var(--line-200)",
                            borderRadius: "var(--r-md)",
                            padding: "0 12px",
                            fontFamily: "var(--font-sans)",
                          }}
                        />
                      </span>
                    )}
                  </span>
                </label>
              )}
            </>
          )}

          {authed && !useNewAddress && selectedAddressId && (
            <p style={{ fontSize: ".8125rem", color: "var(--ink-500)", margin: "0 0 8px" }}>
              Delivering to your saved address above. Choose &quot;Deliver to a different
              address&quot; to edit details.
            </p>
          )}

          {!enteringNewAddress && address.city.trim() && !addressDeliverable && (
            <p
              role="alert"
              style={{
                margin: "12px 0 0",
                fontSize: ".8125rem",
                color: "var(--danger)",
                fontWeight: 600,
                lineHeight: 1.45,
              }}
            >
              {DELIVERY_AREA_MESSAGE}
            </p>
          )}

          <div style={{ marginTop: 14 }}>
            <Button
              variant="primary"
              full
              onClick={() => setOpenSec(2)}
              disabled={!addressComplete || !addressDeliverable}
            >
              Continue
            </Button>
          </div>
        </CheckoutSection>

        <CheckoutSection
          n={3}
          title="Payment method"
          summary="Cash on Delivery"
          complete
          open={openSec === 2}
          onToggle={() => setOpenSec(openSec === 2 ? -1 : 2)}
        >
          <div
            aria-disabled="true"
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              gap: 14,
              padding: 14,
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--line-200)",
              background: "var(--line-100)",
              alignItems: "center",
              cursor: "not-allowed",
              opacity: 0.92,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "2px solid var(--ink-400)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ink-400)" }}
              />
            </span>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--r-sm)",
                background: "var(--line-200)",
                color: "var(--ink-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="wallet" size={20} color="var(--ink-500)" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <b style={{ fontSize: ".9375rem", color: "var(--ink-700)" }}>Cash on Delivery</b>
                <Chip tone="neutral" size="sm">
                  Only option
                </Chip>
              </div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>
                Pay Rs. {total.toLocaleString()} when your order is delivered
              </div>
            </div>
          </div>
          <p style={{ fontSize: ".8125rem", color: "var(--ink-400)", margin: "12px 0 0" }}>
            eSewa, Khalti, and card payments are coming soon.
          </p>
          <div
            style={{
              marginTop: 14,
              background: "var(--tint-blue-50)",
              borderRadius: "var(--r-md)",
              padding: 12,
              fontSize: ".8125rem",
              color: "var(--blue)",
              display: "flex",
              gap: 8,
            }}
          >
            <Icon name="shieldCheck" size={18} color="var(--blue)" style={{ flexShrink: 0 }} />
            <span>
              Our delivery partner may call to confirm your address. Please keep your phone
              reachable.
            </span>
          </div>
        </CheckoutSection>
      </div>

      {/* Delivery option — customer picks the speed; combined pricing is auto */}
      <DeliveryOptionPicker cart={cart} tier={deliveryTier} onChange={setDeliveryTier} />

      {/* Cancellation + refund policy — shown before order is placed */}
      <PolicyDisclosure pay={pay} />

      {/* Confirm bar */}
      <div
        style={{
          marginTop: 14,
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          padding: 20,
        }}
      >
        <Row label="Subtotal" value={bd.subtotal} />
        <Row label={`Delivery · ${bd.deliveryLabel}`} value={bd.delivery} />
        {bd.discount > 0 && <Row label="Discount" value={bd.discount} color="var(--success)" />}
        <Row label="Total" value={total} strong />
        <div style={{ marginTop: 18 }}>
          <Button
            variant="primary"
            full
            size="lg"
            loading={loading}
            onClick={submit}
            disabled={!canPlaceOrder}
          >
            {loading ? "Placing order…" : payLabel}
          </Button>
          {!canPlaceOrder && (
            <p
              role={phoneComplete && addressComplete && !addressDeliverable ? "alert" : undefined}
              style={{
                textAlign: "center",
                fontSize: ".8125rem",
                color:
                  phoneComplete && addressComplete && !addressDeliverable
                    ? "var(--danger)"
                    : "var(--ink-500)",
                fontWeight: phoneComplete && addressComplete && !addressDeliverable ? 600 : 400,
                marginTop: 10,
                marginBottom: 0,
                lineHeight: 1.45,
              }}
            >
              {phoneComplete && addressComplete && !addressDeliverable
                ? DELIVERY_AREA_MESSAGE
                : "Add your phone number and delivery address to place the order."}
            </p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            marginTop: 12,
            color: "var(--ink-400)",
            fontSize: ".75rem",
          }}
        >
          <Icon name="lock" size={13} color="var(--ink-400)" /> Your details are safe with us
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: ".75rem",
            color: "var(--ink-500)",
            marginTop: 10,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          💙 Sorry, it's cash on delivery only for now — digital payments are on the way. Thanks for
          your patience!
        </p>
      </div>
    </div>
  );
}

/* ---------- Cancellation + Refund policy disclosure (checkout) ---------- */
function refundWindow(pay) {
  if (pay === "card") return "5–7 working days to your card";
  if (pay === "cod") return "1–3 working days to your BazaarCo wallet";
  return "1–3 working days to your wallet"; // eSewa / Khalti / Fonepay
}
function PolicyDisclosure({ pay }) {
  const rows = [
    "Free cancellation before BazaarCo pickup",
    "7-day returns for damaged, wrong, or not-as-described items",
    `Refunds once approved — ${refundWindow(pay)}`,
  ];
  return (
    <div
      style={{
        marginTop: 16,
        background: "#fff",
        border: "1px solid var(--line-200)",
        borderRadius: "var(--r-lg)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: ".9375rem",
          color: "var(--ink-900)",
          marginBottom: 12,
        }}
      >
        <Icon name="shieldCheck" size={16} color="var(--blue)" /> Cancellation &amp; refunds
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon
              name="check"
              size={15}
              color="var(--success)"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <span style={{ fontSize: ".8125rem", color: "var(--ink-600)", lineHeight: 1.4 }}>
              {r}
            </span>
          </div>
        ))}
      </div>
      <details style={{ marginTop: 12 }}>
        <summary
          style={{
            cursor: "pointer",
            color: "var(--blue)",
            fontWeight: 600,
            fontSize: ".8125rem",
            listStyle: "none",
          }}
        >
          Read the full policy
        </summary>
        <div
          style={{ marginTop: 10, fontSize: ".8125rem", color: "var(--ink-500)", lineHeight: 1.6 }}
        >
          <p style={{ margin: "0 0 8px" }}>
            <b style={{ color: "var(--ink-700)" }}>Cancellation.</b> You can cancel free of charge
            any time before BazaarCo pickup collects it from the seller. Orders may also be
            cancelled if the seller cannot fulfil them or the order breaks platform policies — you
            are refunded in full in that case.
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <b style={{ color: "var(--ink-700)" }}>Returns.</b> Submit a return request through
            BazaarCo within 7 days of delivery. Eligibility depends on the product condition, the
            seller's return policy, and the return window. Damaged, wrong, or not-as-described items
            are always covered.
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: "var(--ink-700)" }}>Refunds.</b> Refunds are processed once the
            return is approved and verified. The timeline depends on your payment method: wallets
            (eSewa, Khalti, Fonepay) and COD refund to your BazaarCo wallet in 1–3 working days;
            card payments refund to your card in 5–7 working days.
          </p>
        </div>
      </details>
    </div>
  );
}

/* ---------- ORDER SUCCESS ---------- */
export function OrderSuccess({ total }) {
  const { nav, openTracking } = useBz();
  const orderId = useBazaarStore((s) => s.lastOrderId);
  return (
    <div
      className="bz-order-success"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "40px 28px" }}
    >
      <div
        className="bz-order-success__card"
        style={{
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-xl)",
          padding: 36,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(22,163,74,.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="check" size={30} color="#fff" />
          </span>
        </div>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--ink-900)" }}>
          Order placed!
        </h1>
        <p style={{ color: "var(--ink-500)", marginTop: 8 }}>
          Order{" "}
          <b className="tnum" style={{ color: "var(--ink-900)" }}>
            #{orderId}
          </b>{" "}
          confirmed
          {total > 0 && (
            <>
              {" "}
              · <span className="tnum">Rs. {total.toLocaleString()}</span>
            </>
          )}
        </p>
        <div
          className="bz-order-success__actions"
          style={{ display: "flex", gap: 12, marginTop: 28 }}
        >
          <Button
            className="bz-order-success__action"
            variant="primary"
            full
            size="lg"
            icon="package"
            disabled={!orderId}
            href={pathFromScreen("tracking", undefined, undefined, orderId)}
            onNavigate={() => orderId && openTracking(orderId)}
          >
            Track order
          </Button>
          <Button
            className="bz-order-success__action"
            variant="secondary"
            full
            size="lg"
            href={pathFromScreen("home")}
          >
            Continue shopping
          </Button>
        </div>
        <Button variant="ghost" full icon="headphones" style={{ marginTop: 10 }}>
          Need help? Call us
        </Button>
      </div>
      <p
        style={{
          textAlign: "center",
          color: "var(--ink-400)",
          fontSize: ".8125rem",
          marginTop: 16,
        }}
      >
        Email receipt sent to your inbox
      </p>
    </div>
  );
}
