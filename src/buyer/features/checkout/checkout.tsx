// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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
  SectionHead,
  TINTS,
  AllInPriceCard,
  OTPInput,
  MenuRow,
  ChipGroup,
  MobileBuyBar,
  LandmarkAddress,
  VoiceMicButton,
  usePaged,
  usePages,
  LoadMore,
  PageBar,
  BackToTop,
} from "@/components/ui";
import { useCatalog } from "@/shared/hooks/use-catalog";
import { formatNPR } from "@/shared/lib/money";
import { bargainExpiryLabel } from "@/shared/lib/bargain-expiry";
import { useAddresses, pickDefaultAddress } from "@/buyer/hooks/use-addresses";
import { SavedAddressPicker } from "@/buyer/features/profile/addresses";
import {
  ADDRESS_LABEL_PRESETS,
  isAddressComplete,
  savedAddressToDelivery,
} from "@/buyer/lib/saved-address";
import {
  DEFAULT_DELIVERY,
  isDeliverableCity,
  DELIVERY_AREA_MESSAGE,
} from "@/shared/lib/delivery-location";
import { useBazaarStore } from "@/store/bazaar-store";
import { queryKeys } from "@/shared/api/query-keys";
import {
  BazaarCtx,
  useBz,
  ProductCard,
  ProductRail,
  CategoryTile,
  Navbar,
  Footer,
} from "@/components/common";
import { pathFromScreen, searchPath } from "@/config/routes";
import {
  resolveDelivery,
  deliveryChoices,
  distinctSellerCount,
  deliveryTypeLabel,
} from "@/buyer/lib/delivery-options";
import { useOrder } from "@/buyer/hooks/use-orders";
import { EsewaRedirectForm } from "@/components/payment/esewa-redirect-form";
import type { EsewaPaymentInit } from "@/buyer/api/orders";
import {
  selectedLines,
  allSelected,
  cartLineKey,
  isLineSelected,
  toggleLine,
  toggleAll,
} from "@/buyer/lib/cart-selection";
import { toast } from "@/shared/lib/toast";

// Cap the quantity stepper at the stock the server reports for this line, the
// same rule the PDP uses. Falls back to 99 when stock is unknown; checkout
// re-validates against live stock server-side regardless.
function lineMaxQty(line) {
  return typeof line.availableStock === "number" && line.availableStock > 0
    ? Math.min(line.availableStock, 99)
    : 99;
}

export function priceBreakdown(cart, deliveryTier = "standard") {
  // Money is whole rupees end to end, so line totals and the sum are plain
  // integer arithmetic — no rounding needed.
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
        {free ? "Free" : formatNPR(value)}
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
              className="bz-hover-border"
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
                    {formatNPR(c.fee)}
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

/* ---------- Branded selection checkbox ---------- */
function SelectCheck({ checked, indeterminate, onChange, label, size = 22 }) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onChange}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 6,
        border: `2px solid ${on ? "var(--blue)" : "var(--ink-400)"}`,
        background: on ? "var(--blue)" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        transition: "background .15s var(--ease), border-color .15s var(--ease)",
      }}
    >
      {indeterminate ? (
        <Icon name="minus" size={size - 8} color="#fff" />
      ) : checked ? (
        <Icon name="check" size={size - 8} color="#fff" />
      ) : null}
    </button>
  );
}

/* ---------- CART ---------- */
export function Cart() {
  const { t } = useTranslation();
  const {
    cart,
    updateCartQty,
    removeFromCart,
    nav,
    openProduct,
    cartLoading,
    authed,
    promptLogin,
  } = useBz();
  const { sellerOf } = useCatalog();
  const deliveryTier = useBazaarStore((s) => s.deliveryTier);
  const selectedCartIds = useBazaarStore((s) => s.selectedCartIds);
  const setSelectedCartIds = useBazaarStore((s) => s.setSelectedCartIds);
  const [confirm, setConfirm] = useState(null);

  // Only the lines the shopper ticked get priced and ordered.
  const selectedCart = selectedLines(cart, selectedCartIds);
  const selectedCount = selectedCart.length;
  const everySelected = allSelected(cart, selectedCartIds);
  const someSelected = selectedCount > 0 && !everySelected;
  const bd = priceBreakdown(selectedCart, deliveryTier);

  const toggleOne = (key) => setSelectedCartIds((prev) => toggleLine(cart, prev, key));
  const toggleEvery = () => setSelectedCartIds((prev) => toggleAll(cart, prev));

  const goToCheckout = () => {
    if (selectedCount === 0) return;
    if (authed) nav("checkout");
    else promptLogin(t("checkout.signInCheckout"));
  };

  const setQty = (line, q) => {
    void updateCartQty(line.id, q, line.variantId);
  };
  const remove = (line) => {
    void removeFromCart(line.id, line.variantId)
      .then(() => {
        setConfirm(null);
        toast.success(t("checkout.removedFromCart"));
      })
      .catch(() => {}); // error already toasted inside removeFromCart
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
        {t("checkout.loadingCart")}
      </div>
    );
  }

  if (cart.length === 0)
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px" }}
      >
        <EmptyState
          title={t("checkout.emptyTitle")}
          message={t("checkout.emptyMessage")}
          cta={t("checkout.browseProducts")}
          ctaHref={searchPath()}
          secondary={t("checkout.watch")}
          secondaryHref={pathFromScreen("video")}
        />
      </div>
    );

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 0" }}
    >
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
        <Icon name="chevronLeft" size={16} /> {t("checkout.continueShopping")}
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
        {t("checkout.myCart")}
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
        {t("checkout.yourCart")}{" "}
        <span
          className="tnum"
          style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: "1rem" }}
        >
          ·{" "}
          {cart.length === 1
            ? t("checkout.itemCount", { count: cart.length })
            : t("checkout.itemsCount", { count: cart.length })}
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
          {/* Select-all bar — drives selection on every viewport. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: "12px 16px",
            }}
          >
            <SelectCheck
              checked={everySelected}
              indeterminate={someSelected}
              onChange={toggleEvery}
              label={everySelected ? t("checkout.deselectAll") : t("checkout.selectAllItems")}
            />
            <button
              type="button"
              onClick={toggleEvery}
              className="bz-hover-dim"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: ".9375rem",
                color: "var(--ink-800)",
                fontFamily: "inherit",
              }}
            >
              {t("checkout.selectAll")}
            </button>
            <span
              className="tnum"
              style={{ marginLeft: "auto", fontSize: ".8125rem", color: "var(--ink-400)" }}
            >
              {selectedCount} of {cart.length} selected
            </span>
          </div>
          {cart.map((it) => {
            const s = sellerOf(it);
            const key = cartLineKey(it);
            const sel = isLineSelected(key, selectedCartIds);
            return (
              <div
                key={key}
                className="bz-cart-card"
                style={{
                  display: "flex",
                  gap: 14,
                  background: "#fff",
                  border: `1.5px solid ${sel ? "var(--blue)" : "var(--line-200)"}`,
                  borderRadius: "var(--r-lg)",
                  padding: 16,
                  transition: "border-color .15s var(--ease), opacity .15s var(--ease)",
                  opacity: sel ? 1 : 0.6,
                }}
              >
                <SelectCheck
                  checked={sel}
                  onChange={() => toggleOne(key)}
                  label={`${sel ? "Deselect" : "Select"} ${it.name}`}
                />
                <AppLink
                  href={pathFromScreen("pdp", it.id)}
                  onNavigate={() => openProduct(it)}
                  className="bz-cart-card__media"
                  style={{ cursor: "pointer", flexShrink: 0, alignSelf: "flex-start" }}
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
                      style={{ cursor: "pointer", textDecoration: "none", minWidth: 0 }}
                    >
                      <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>{it.name}</div>
                      {it.variantName && (
                        <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>
                          {it.variantName}
                        </div>
                      )}
                      {it.bargained && (
                        <div
                          style={{
                            fontSize: ".75rem",
                            color: "var(--success)",
                            fontWeight: 700,
                            marginTop: 2,
                          }}
                        >
                          Bargained price
                          {bargainExpiryLabel(it.bargainExpiresAt)
                            ? ` · ${bargainExpiryLabel(it.bargainExpiresAt)}`
                            : ""}
                        </div>
                      )}
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
                        <Icon name="badgeCheck" size={13} color="var(--blue)" /> {s?.name}
                      </div>
                    </AppLink>
                    <Price value={it.price} size="sm" />
                  </div>
                  <div
                    className="bz-cart-card__actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <QtyStepper
                      value={it.qty}
                      onChange={(q) => setQty(it, q)}
                      max={lineMaxQty(it)}
                    />
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

        {/* summary — sticky sidebar on desktop, stacked breakdown on mobile.
            The in-card checkout button is hidden ≤768px (the sticky bar owns
            the action there), so the CTA is never duplicated. */}
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
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ fontWeight: 700 }}>Order summary</span>
              <span className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
                {selectedCount} item{selectedCount === 1 ? "" : "s"}
              </span>
            </div>
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
            <div className="bz-hide-mobile" style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                full
                size="lg"
                iconRight="arrowRight"
                disabled={selectedCount === 0}
                onClick={goToCheckout}
              >
                {selectedCount === 0
                  ? "Select items to checkout"
                  : `Checkout · ${selectedCount} item${selectedCount === 1 ? "" : "s"}`}
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

      {/* Mobile spacer so the last card clears the sticky bar + bottom nav. */}
      <div className="bz-show-mobile" style={{ display: "none", height: 132 }} aria-hidden />

      {/* Mobile sticky action bar — total + checkout, pinned above the tab nav.
          Selection itself is driven by the select-all bar / per-item boxes. */}
      <div
        className="bz-show-mobile bz-show-mobile--flex"
        style={{
          display: "none",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
          zIndex: 95,
          alignItems: "center",
          gap: 12,
          background: "#fff",
          borderTop: "1px solid var(--line-200)",
          boxShadow: "0 -2px 12px rgba(15,23,42,.08)",
          padding: "12px 16px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
            {selectedCount} item{selectedCount === 1 ? "" : "s"} · incl. delivery
          </div>
          <div
            className="tnum"
            style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--blue-deep)" }}
          >
            {formatNPR(bd.total)}
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          iconRight="arrowRight"
          disabled={selectedCount === 0}
          onClick={goToCheckout}
        >
          {selectedCount === 0 ? "Select items" : "Checkout"}
        </Button>
      </div>

      {confirm && (
        <ConfirmModal
          title="Remove item?"
          message={`Remove "${confirm.name}" from your cart?`}
          confirmLabel="Remove"
          onConfirm={() => remove(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  const trapFocus = useCallback((e) => {
    if (e.key !== "Tab") return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
      trapFocus(e);
    };
    document.addEventListener("keydown", onKey);
    const firstBtn = dialogRef.current?.querySelector("button");
    firstBtn?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, trapFocus]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
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
        <h3 id="confirm-dialog-title" style={{ margin: "0 0 8px", fontSize: "1.125rem" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 22px", color: "var(--ink-500)", fontSize: ".9375rem" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="primary" full onClick={onCancel} style={{ flex: 2 }}>
            Keep
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} style={{ flex: 1 }}>
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
  const { cart, nav, placeOrder, checkoutEsewa, updateCartQty } = useBz();
  const queryClient = useQueryClient();
  const authed = useBazaarStore((s) => s.authed);
  const buyerPhone = useBazaarStore((s) => s.buyerPhone);
  const setBuyerPhone = useBazaarStore((s) => s.setBuyerPhone);
  const deliveryTier = useBazaarStore((s) => s.deliveryTier);
  const setDeliveryTier = useBazaarStore((s) => s.setDeliveryTier);
  const selectedCartIds = useBazaarStore((s) => s.selectedCartIds);
  const setSelectedCartIds = useBazaarStore((s) => s.setSelectedCartIds);
  // Removing an item here just deselects it from this order — it stays saved in
  // the cart for later (non-destructive), and the total drops immediately.
  const removeFromOrder = (key) => {
    setSelectedCartIds((prev) => toggleLine(cart, prev, key));
    toast.success("Removed from this order — still saved in your cart");
  };
  // Price and place only what the buyer selected in the cart, so the total
  // shown here is exactly what the server charges (provider sends the same set).
  const selectedCart = selectedLines(cart, selectedCartIds);
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
  // COD stays the default (safest). eSewa creates an awaiting_payment order and
  // redirects to the gateway; the order is only placed after server verification.
  const [payMethod, setPayMethod] = useState<"cod" | "esewa">("cod");
  // Set once the backend returns eSewa form fields — triggers the redirect form.
  const [esewaInit, setEsewaInit] = useState<EsewaPaymentInit | null>(null);
  const bd = priceBreakdown(selectedCart, deliveryTier);
  const total = bd.total;
  const pay = payMethod;

  // When there are no saved addresses, the buyer is entering their first one.
  const enteringNewAddress = useNewAddress || !savedAddresses.length;
  const mustSaveNewAddress = authed && !savedAddresses.length;
  const shouldSaveNewAddress = mustSaveNewAddress || saveNewAddress;

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneComplete = isValidNpPhone(phoneDigits);
  const addressComplete = isAddressComplete(address);
  // We currently deliver only inside Kathmandu — block anything else.
  const addressDeliverable = isDeliverableCity(address.city);
  // Guard the empty-selection edge: never place an order with nothing selected
  // (an empty id list would otherwise be read server-side as "the whole cart").
  const hasSelection = selectedCart.length > 0;
  const canPlaceOrder = phoneComplete && addressComplete && addressDeliverable && hasSelection;

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
        paymentMethod: payMethod,
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

      if (payMethod === "esewa") {
        // Create the awaiting_payment order + get signed fields, then redirect.
        const init = await checkoutEsewa(payload);
        if (payload.saveAddress) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
        }
        if (init) setEsewaInit(init); // mounts EsewaRedirectForm → auto-submits
        return;
      }

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

  const payLabel = payMethod === "esewa" ? "Pay with eSewa" : "Place order";

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 80px" }}
    >
      {/* eSewa hand-off: full-screen overlay that auto-submits to the gateway. */}
      {esewaInit && (
        <EsewaRedirectForm paymentUrl={esewaInit.paymentUrl} fields={esewaInit.fields} />
      )}
      <AppLink
        href={pathFromScreen("cart")}
        className="bz-back-link"
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

      <div
        className="bz-stack-900"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 32,
          alignItems: "start",
          marginTop: 8,
        }}
      >
        {/* LEFT column — the steps the shopper works through */}
        <div>
          {/* Your order — an editable bill: adjust qty or remove without leaving checkout */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 20,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--ink-900)" }}>
                Your order
              </span>
              <span className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
                {selectedCart.length} item{selectedCart.length === 1 ? "" : "s"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: ".8125rem", color: "var(--ink-400)" }}>
              Adjust quantity or remove an item to fit your budget — changes update the total below.
            </p>

            {selectedCart.length === 0 ? (
              <p style={{ margin: "16px 0 0", fontSize: ".9375rem", color: "var(--ink-500)" }}>
                No items in this order.{" "}
                <AppLink
                  href={pathFromScreen("cart")}
                  style={{ color: "var(--blue)", fontWeight: 700, textDecoration: "none" }}
                >
                  Go to your cart
                </AppLink>{" "}
                to add some.
              </p>
            ) : (
              <div style={{ marginTop: 8 }}>
                {selectedCart.map((it, i) => (
                  <div
                    key={cartLineKey(it)}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "14px 0",
                      borderTop: i > 0 ? "1px solid var(--line-100)" : "none",
                    }}
                  >
                    {it.img ? (
                      <img
                        src={it.img}
                        alt={it.name}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: "var(--r-md)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Placeholder
                        icon={it.icon}
                        style={{ width: 64, height: 64 }}
                        radius="var(--r-md)"
                      />
                    )}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: ".9375rem",
                              color: "var(--ink-900)",
                            }}
                          >
                            {it.name}
                          </div>
                          {it.variantName && (
                            <div
                              style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}
                            >
                              {it.variantName}
                            </div>
                          )}
                          <div
                            className="tnum"
                            style={{ fontSize: ".8125rem", color: "var(--ink-400)", marginTop: 2 }}
                          >
                            {formatNPR(it.price)} each
                            {it.bargained ? " · bargained" : ""}
                          </div>
                        </div>
                        <div
                          className="tnum"
                          style={{
                            fontWeight: 800,
                            fontSize: ".9375rem",
                            color: "var(--ink-900)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNPR(it.price * it.qty)}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <QtyStepper
                          value={it.qty}
                          onChange={(q) => updateCartQty(it.id, q, it.variantId)}
                          max={lineMaxQty(it)}
                        />
                        <button
                          type="button"
                          onClick={() => removeFromOrder(cartLineKey(it))}
                          className="bz-hover-dim"
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
                            fontFamily: "inherit",
                          }}
                        >
                          <Icon name="x" size={15} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <CheckoutSection
              n={1}
              title="Phone number"
              summary={
                phoneComplete ? `+977 ${phoneDigits}` : "Add your mobile for delivery updates"
              }
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
                      Add at least one delivery address to continue. We&apos;ll save it to your
                      profile so next time it&apos;s one tap.
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
                                    className="bz-hover-border"
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
              summary={payMethod === "esewa" ? "eSewa Wallet" : "Cash on Delivery"}
              complete
              open={openSec === 2}
              onToggle={() => setOpenSec(openSec === 2 ? -1 : 2)}
            >
              <div
                role="radiogroup"
                aria-label="Payment method"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  {
                    id: "cod" as const,
                    label: "Cash on Delivery",
                    desc: `Pay ${formatNPR(total)} when your order is delivered`,
                  },
                  {
                    id: "esewa" as const,
                    label: "eSewa Wallet",
                    desc: "Pay now via eSewa — you'll be redirected to complete payment securely",
                  },
                ].map((opt) => {
                  const active = payMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPayMethod(opt.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        gap: 14,
                        padding: 14,
                        borderRadius: "var(--r-md)",
                        border: `1.5px solid ${active ? "var(--blue)" : "var(--line-200)"}`,
                        background: active ? "var(--tint-blue-50)" : "#fff",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: `2px solid ${active ? "var(--blue)" : "var(--ink-400)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {active && (
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
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "var(--r-sm)",
                          background: active ? "var(--blue)" : "var(--line-200)",
                          color: active ? "#fff" : "var(--ink-500)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="wallet" size={20} color={active ? "#fff" : "var(--ink-500)"} />
                      </span>
                      <span style={{ flex: 1 }}>
                        <b
                          style={{
                            fontSize: ".9375rem",
                            color: "var(--ink-900)",
                            display: "block",
                          }}
                        >
                          {opt.label}
                        </b>
                        <span style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
                          {opt.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {payMethod === "cod" && (
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
                  <Icon
                    name="shieldCheck"
                    size={18}
                    color="var(--blue)"
                    style={{ flexShrink: 0 }}
                  />
                  <span>
                    Our delivery partner may call to confirm your address. Please keep your phone
                    reachable.
                  </span>
                </div>
              )}
            </CheckoutSection>
          </div>

          {/* Delivery option — customer picks the speed; combined pricing is auto.
          Keyed off the SELECTED items so the fee matches the charge. */}
          <DeliveryOptionPicker
            cart={selectedCart}
            tier={deliveryTier}
            onChange={setDeliveryTier}
          />

          {/* Cancellation + refund policy — shown before order is placed */}
          <PolicyDisclosure pay={pay} />
        </div>

        {/* RIGHT column — persistent order summary + primary CTA (sticky on desktop) */}
        <div
          style={{
            position: "sticky",
            top: 96,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--ink-900)" }}>
                Order summary
              </span>
              <span className="tnum" style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
                {selectedCart.length} item{selectedCart.length === 1 ? "" : "s"}
              </span>
            </div>
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
                {loading
                  ? payMethod === "esewa"
                    ? "Starting eSewa…"
                    : "Placing order…"
                  : payLabel}
              </Button>
              {!canPlaceOrder && (
                <p
                  role={
                    phoneComplete && addressComplete && !addressDeliverable ? "alert" : undefined
                  }
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
                  {!hasSelection
                    ? "Your order is empty — add an item from your cart to place the order."
                    : phoneComplete && addressComplete && !addressDeliverable
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
            {/*<p
              style={{
                textAlign: "center",
                fontSize: ".75rem",
                color: "var(--ink-500)",
                marginTop: 10,
                marginBottom: 0,
                lineHeight: 1.5,
              }}
            >
              💙 Sorry, it's cash on delivery only for now — digital payments are on the way. Thanks
              for your patience!
            </p>*/}
          </div>
        </div>
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
/* ---------- ORDER SUCCESS — confirmation flow (cf. Daraz) ---------- */
const successCard = {
  background: "#fff",
  border: "1px solid var(--line-200)",
  borderRadius: "var(--r-lg)",
};

export function OrderSuccess({ total }) {
  const { openTracking } = useBz();
  const orderId = useBazaarStore((s) => s.lastOrderId);
  const user = useBazaarStore((s) => s.user);
  const { byId } = useCatalog();
  const { data: order } = useOrder(orderId);

  // Prefer the authoritative figure from the fetched order; fall back to the
  // total the store stashed at checkout so the header renders instantly.
  const grandTotal = order?.total ?? total ?? 0;
  const deliveryFee = order?.deliveryFee ?? 0;
  const subtotal = Math.max(0, grandTotal - deliveryFee);
  const isCod = (order?.paymentMethod ?? "cod") === "cod";
  const lineItems = order?.lineItems ?? [];
  const products = lineItems.map((li) => byId(li.productId)).filter(Boolean);
  const extraCount = Math.max(0, lineItems.length - 3);
  const money = (n: number) => formatNPR(n);

  return (
    <div
      className="bz-order-success"
      style={{ maxWidth: 760, margin: "0 auto", padding: "40px 28px" }}
    >
      {/* 1 — Thank you + total + order number */}
      <div
        className="bz-order-success__card"
        style={{ ...successCard, padding: 32, textAlign: "center" }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--tint-blue-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="check" size={32} color="var(--blue)" />
        </div>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Thank you for your purchase!
        </h1>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: ".875rem", color: "var(--ink-500)", fontWeight: 600 }}>Rs.</span>
          <span
            className="tnum"
            style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--ink-900)" }}
          >
            {Number(grandTotal).toLocaleString("en-IN")}
          </span>
        </div>
        {orderId && (
          <div style={{ marginTop: 8, fontSize: ".9375rem", color: "var(--ink-500)" }}>
            Your order number is{" "}
            <span
              className="tnum"
              style={{ color: "var(--ink-900)", fontWeight: 700, overflowWrap: "anywhere" }}
            >
              {orderId}
            </span>
          </div>
        )}
      </div>

      {/* 2 — Cash-on-delivery: amount to keep ready */}
      {isCod && (
        <div style={{ ...successCard, padding: 24, textAlign: "center", marginTop: 16 }}>
          <div style={{ color: "var(--ink-600)", fontSize: ".9375rem" }}>
            Please have this amount ready on delivery day.
          </div>
          <div
            className="tnum"
            style={{ marginTop: 8, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}
          >
            {money(grandTotal)}
          </div>
        </div>
      )}

      {/* 3 — Get by: items + estimated delivery + track */}
      <div style={{ marginTop: 24 }}>
        <h2
          style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "var(--ink-900)" }}
        >
          Get by
        </h2>
        <div style={{ ...successCard }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {products.slice(0, 3).map((p, i) =>
                p.img ? (
                  <img
                    key={p.id ?? i}
                    src={p.img}
                    alt={p.name}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: "var(--r-md)",
                    }}
                  />
                ) : (
                  <Placeholder
                    key={p.id ?? i}
                    icon={p.icon}
                    style={{ width: 56, height: 56 }}
                    radius="var(--r-md)"
                  />
                ),
              )}
              {extraCount > 0 && (
                <span
                  className="tnum"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--r-md)",
                    background: "var(--line-100)",
                    color: "var(--ink-600)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  +{extraCount}
                </span>
              )}
              {products.length === 0 && (
                <span style={{ color: "var(--ink-400)", fontSize: ".875rem" }}>Your order</span>
              )}
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--line-200)",
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
              To track your order, go to <b style={{ color: "var(--ink-800)" }}>My orders</b>
            </span>
            <Button
              variant="secondary"
              icon="package"
              disabled={!orderId}
              href={orderId ? pathFromScreen("tracking", undefined, undefined, orderId) : undefined}
              onNavigate={() => orderId && openTracking(orderId)}
            >
              View order
            </Button>
          </div>
        </div>
      </div>

      {/* 4 — Confirmation email notice */}
      {user?.email && (
        <div
          style={{
            ...successCard,
            marginTop: 14,
            padding: 16,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <Icon name="mail" size={20} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: ".875rem", color: "var(--ink-600)", lineHeight: 1.5 }}>
            We&apos;ve sent a confirmation email to{" "}
            <b style={{ color: "var(--ink-900)" }}>{user.email}</b> with the details of your order.
          </span>
        </div>
      )}

      {/* 5 — Order summary (collapsible) */}
      <details style={{ ...successCard, marginTop: 14 }}>
        <summary
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: 16,
            cursor: "pointer",
            listStyle: "none",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>Order Summary</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="tnum" style={{ fontWeight: 800, color: "var(--blue-deep)" }}>
              {money(grandTotal)}
            </span>
            <Icon name="chevronDown" size={18} color="var(--ink-400)" />
          </span>
        </summary>
        <div style={{ padding: "0 16px 16px" }}>
          <Row label="Subtotal" value={subtotal} />
          <Row label={`Delivery · ${deliveryTypeLabel(order?.deliveryType)}`} value={deliveryFee} />
          <Row label="Total" value={grandTotal} strong />
        </div>
      </details>

      {/* 6 — Continue shopping */}
      <div className="bz-order-success__actions" style={{ marginTop: 24 }}>
        <Button variant="primary" size="lg" full href={pathFromScreen("home")}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
