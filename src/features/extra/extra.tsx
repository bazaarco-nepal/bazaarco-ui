// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  ApiState,
  AppLink,
} from "@/components/ui";
import { usePathname } from "next/navigation";
import { orderIdFromPath, pathFromScreen, searchPath } from "@/config/routes";
import { deliveryTypeLabel } from "@/lib/delivery-options";
import { formatNPR } from "@/lib/money";
import { useCatalog } from "@/hooks/use-catalog";
import { useTracking } from "@/hooks/use-tracking";
import { useCancelOrder, useOrder } from "@/hooks/use-orders";
import { canCancelOrder } from "@/lib/order-utils";
import { ConfirmModal } from "@/features/checkout/checkout";
import { useAcceptCounterOffer, useBargains } from "@/hooks/use-bargains";
import { bargainExpiryLabel } from "@/lib/bargain-expiry";
import { useSavedQuery } from "@/hooks/use-saved";
import { useBazaarStore } from "@/store/bazaar-store";
import { toast } from "@/lib/toast";
import {
  BazaarCtx,
  useBz,
  ProductCard,
  ProductRail,
  CategoryTile,
  Navbar,
  Footer,
  SellerRow,
} from "@/components/common";

export function Tracking() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const pathname = usePathname();
  const routeOrderId = orderIdFromPath(pathname);
  const lastOrderId = useBazaarStore((s) => s.lastOrderId);
  const orderId = routeOrderId ?? lastOrderId ?? "";
  const { data, isLoading, isError, error } = useTracking(orderId, Boolean(orderId));
  const { data: order } = useOrder(orderId || null);
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const nodes = data?.nodes ?? [];

  if (!orderId) {
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 80px" }}
      >
        <EmptyState
          icon="package"
          title={t("tracking.noOrderTitle")}
          message={t("tracking.noOrderMessage")}
          cta={t("tracking.myOrders")}
          ctaHref={pathFromScreen("orders")}
        />
      </div>
    );
  }

  const trackingStatus = nodes
    .find((n) => n.state === "current")
    ?.t?.toLowerCase()
    .includes("deliver")
    ? "delivered"
    : nodes
          .find((n) => n.state === "current")
          ?.t?.toLowerCase()
          .includes("ship")
      ? "shipped"
      : nodes
            .find((n) => n.state === "current")
            ?.t?.toLowerCase()
            .includes("pack")
        ? "packaging_started"
        : "accepted";

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 0" }}
      >
        <AppLink
          href={pathFromScreen("orders")}
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
            marginBottom: 16,
            fontSize: ".875rem",
            textDecoration: "none",
          }}
        >
          <Icon name="chevronLeft" size={16} /> Back to orders
        </AppLink>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}
            >
              Order <span className="tnum">#{data?.orderId ?? orderId}</span>
            </h1>
            <span style={{ fontSize: ".875rem", color: "var(--ink-400)" }}>
              Track your delivery
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <StatusPill
              status={
                order?.status === "cancelled"
                  ? "cancelled"
                  : (order?.status ?? (nodes.length ? trackingStatus : "confirmed"))
              }
            />
            {order && canCancelOrder(order) && (
              <Button
                variant="secondary"
                disabled={cancelOrder.isPending}
                onClick={() => setConfirmCancel(true)}
              >
                Cancel order
              </Button>
            )}
          </div>
        </div>

        <div
          className="bz-stack-900"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 28,
            }}
          >
            {nodes.length === 0 && !isLoading ? (
              <p style={{ margin: 0, color: "var(--ink-500)", fontSize: ".9375rem" }}>
                Tracking updates will appear here once the seller ships your order.
              </p>
            ) : null}
            {nodes.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 16, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background:
                        n.state === "done"
                          ? "var(--blue)"
                          : n.state === "current"
                            ? "var(--saffron)"
                            : "#fff",
                      border: n.state === "future" ? "2px solid var(--line-200)" : "none",
                      animation: n.state === "current" ? "bz-pulse 1.8s infinite" : "none",
                    }}
                  >
                    {n.state === "done" && <Icon name="check" size={15} color="#fff" />}
                    {n.state === "current" && (
                      <span
                        style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }}
                      />
                    )}
                  </span>
                  {i < nodes.length - 1 && (
                    <span
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 40,
                        background: n.state === "done" ? "var(--blue)" : "var(--line-200)",
                      }}
                    />
                  )}
                </div>
                <div style={{ paddingBottom: i < nodes.length - 1 ? 24 : 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: ".9375rem",
                      color: n.state === "future" ? "var(--ink-400)" : "var(--ink-900)",
                    }}
                  >
                    {n.t}
                  </div>
                  <div
                    style={{ fontSize: ".8125rem", color: "var(--ink-400)", margin: "2px 0 4px" }}
                  >
                    {n.loc} · {n.time}
                  </div>
                  <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>{n.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <TrackingSidebar nav={nav} order={order} />
        </div>
      </div>
      {confirmCancel && order && (
        <ConfirmModal
          title={t("tracking.cancelOrderTitle")}
          message={t("tracking.cancelOrderMessage", { id: order.id })}
          confirmLabel={
            cancelOrder.isPending ? t("tracking.cancelling") : t("tracking.cancelOrder")
          }
          onConfirm={async () => {
            try {
              await cancelOrder.mutateAsync(order.id);
              setConfirmCancel(false);
            } catch {
              /* surfaced by API layer */
            }
          }}
          onCancel={() => !cancelOrder.isPending && setConfirmCancel(false)}
        />
      )}
    </ApiState>
  );
}

function TrackingSidebar({ nav, order }) {
  const { byId } = useCatalog();
  // Prefer real per-line quantities from the backend; fall back to bare product
  // ids (qty 1) for older payloads. Unit price comes from the live catalog.
  const rawLines = order?.lineItems?.length
    ? order.lineItems
    : (order?.items ?? []).map((productId) => ({ productId, quantity: 1 }));
  const lines = rawLines
    .map((li) => {
      const product = byId(li.productId);
      if (!product) return null;
      // Prefer the price actually charged (snapshot); fall back to live price.
      const unitPrice = li.unitPrice ?? product.price;
      return {
        product,
        qty: li.quantity,
        unitPrice,
        variantName: li.variantName ?? null,
        lineTotal: unitPrice * li.quantity,
      };
    })
    .filter(Boolean);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = order?.total ?? subtotal;
  // Prefer the persisted delivery fee; fall back to the remainder for older orders.
  const delivery = order?.deliveryFee ?? Math.max(0, total - subtotal);
  const deliveryLabel = deliveryTypeLabel(order?.deliveryType);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 96 }}>
      {lines.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: ".9375rem", marginBottom: 14 }}>Items</div>
          {lines.map(({ product, qty, lineTotal, unitPrice, variantName }, i) => (
            <div
              key={`${product.id}-${i}`}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}
            >
              {product.img ? (
                <img
                  src={product.img}
                  alt={product.name}
                  style={{
                    width: 44,
                    height: 44,
                    objectFit: "cover",
                    borderRadius: "var(--r-sm)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Placeholder
                  icon={product.icon}
                  tint={product.tint}
                  style={{ width: 44, height: 44, flexShrink: 0 }}
                  radius="var(--r-sm)"
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: ".8125rem",
                    fontWeight: 600,
                    color: "var(--ink-900)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {product.name}
                </div>
                {variantName && (
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)", marginTop: 2 }}>
                    {variantName}
                  </div>
                )}
                <div
                  className="tnum"
                  style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 3 }}
                >
                  Qty {qty} × {formatNPR(unitPrice)}
                </div>
              </div>
              <span
                className="tnum"
                style={{
                  fontSize: ".8125rem",
                  fontWeight: 700,
                  color: "var(--ink-900)",
                  whiteSpace: "nowrap",
                }}
              >
                {formatNPR(lineTotal)}
              </span>
            </div>
          ))}

          <div
            style={{
              borderTop: "1px solid var(--line-200)",
              marginTop: 4,
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: ".8125rem",
                color: "var(--ink-500)",
              }}
            >
              <span>Subtotal</span>
              <span className="tnum">{formatNPR(subtotal)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: ".8125rem",
                color: "var(--ink-500)",
              }}
            >
              <span style={{ paddingRight: 8 }}>{deliveryLabel}</span>
              <span
                className="tnum"
                style={{
                  whiteSpace: "nowrap",
                  ...(delivery === 0 ? { color: "var(--success)" } : {}),
                }}
              >
                {delivery === 0 ? "Free" : formatNPR(delivery)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "1px solid var(--line-200)",
                marginTop: 4,
                paddingTop: 10,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: ".9375rem", color: "var(--ink-900)" }}>
                Total
              </span>
              <span
                className="tnum"
                style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--blue-deep)" }}
              >
                {formatNPR(total)}
              </span>
            </div>
          </div>
        </div>
      )}
      <Button
        variant="secondary"
        full
        icon="headphones"
        href={pathFromScreen("help")}
        onNavigate={() => nav("help")}
      >
        Need help?
      </Button>
    </div>
  );
}

export function Saved() {
  const { t } = useTranslation();
  const { nav, openProduct, toggleSavedSeller, savedSellers, authed } = useBz();
  const { data, isLoading, isError, error } = useSavedQuery(authed);
  const products = data?.products ?? [];
  const sellers = data?.sellers ?? [];
  const productPaged = usePaged(products, 12, products.length);
  const totalSaved = products.length + sellers.length;

  if (!authed) {
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px" }}
      >
        <EmptyState
          title={t("saved.signInTitle")}
          message={t("saved.signInMessage")}
          cta={t("saved.signIn")}
          ctaHref={pathFromScreen("auth")}
        />
      </div>
    );
  }

  if (isLoading && totalSaved === 0) {
    return (
      <ApiState isLoading isError={false} error={null}>
        <div />
      </ApiState>
    );
  }

  if (totalSaved === 0) {
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px" }}
      >
        <EmptyState
          title={t("saved.emptyTitle")}
          message={t("saved.emptyMessage")}
          cta={t("saved.startExploring")}
          ctaHref={pathFromScreen("home")}
          secondary={t("checkout.watch")}
          secondaryHref={pathFromScreen("video")}
        />
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 0" }}
      >
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
          {t("saved.title")}
        </h1>
        <h1
          className="bz-hide-mobile"
          style={{
            margin: "0 0 20px",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          {t("profile.saved")}{" "}
          <span
            className="tnum"
            style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: "1rem" }}
          >
            · {t("saved.savedCount", { count: totalSaved })}
          </span>
        </h1>

        {sellers.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.125rem", fontWeight: 700 }}>
              {t("saved.savedSellers")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sellers.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-lg)",
                    padding: "12px 16px",
                  }}
                >
                  <SellerRow
                    seller={s}
                    sellerId={s.id}
                    saved={savedSellers.includes(s.id)}
                    onToggleSave={(id) => {
                      void toggleSavedSeller(id);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <div
              className="bz-grid-cards"
              style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}
            >
              {productPaged.visible.map((p) => (
                <ProductCard key={p.id} p={p} onClick={openProduct} />
              ))}
            </div>
            <LoadMore paged={productPaged} noun="saved items" />
          </section>
        )}
      </div>
    </ApiState>
  );
}

export function Bargains() {
  const { t } = useTranslation();
  const { openProduct, addToCart } = useBz();
  const { data: offers = [], isLoading, isError, error } = useBargains();
  const acceptCounter = useAcceptCounterOffer();
  const [tab, setTab] = useState("all");

  const tones: Record<string, string> = {
    pending: "saffron",
    countered: "blue",
    accepted: "success",
    rejected: "neutral",
    expired: "neutral",
  };
  const labels: Record<string, string> = {
    pending: t("bargains.statusPending"),
    countered: t("bargains.statusCountered"),
    accepted: "Accepted",
    rejected: t("bargains.statusDeclined"),
    expired: "Expired",
  };

  const isActive = (s: string) => s === "pending" || s === "countered";
  const isClosed = (s: string) => s === "rejected" || s === "expired";
  const counts = {
    all: offers.length,
    active: offers.filter((o) => isActive(o.status)).length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    closed: offers.filter((o) => isClosed(o.status)).length,
  };
  const filtered =
    tab === "all"
      ? offers
      : tab === "active"
        ? offers.filter((o) => isActive(o.status))
        : tab === "accepted"
          ? offers.filter((o) => o.status === "accepted")
          : offers.filter((o) => isClosed(o.status));

  const expiryUrgent = (expires: string | null) => {
    if (!expires) return false;
    const ms = new Date(expires).getTime() - Date.now();
    return ms > 0 && ms < 2 * 60 * 60 * 1000;
  };

  const savings = (o: { listed: number; agreed: number | null; yourOffer: number }) => {
    const agreed = o.agreed ?? o.yourOffer;
    return o.listed > agreed ? o.listed - agreed : 0;
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "28px 28px 96px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              {t("bargains.title")}
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".8125rem" }}>
              {t("bargains.subtitle")}
            </p>
          </div>
          {offers.length > 0 && (
            <Button variant="tertiary" size="sm" icon="search" href={searchPath()}>
              Find products
            </Button>
          )}
        </div>

        {offers.length === 0 ? (
          <EmptyState
            title={t("bargains.emptyTitle")}
            message={t("bargains.emptyMessage")}
            cta={t("bargains.browseProducts")}
            ctaHref={searchPath()}
          />
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <ChipGroup
                options={[
                  { value: "all", label: `All · ${counts.all}` },
                  { value: "active", label: `Active · ${counts.active}` },
                  { value: "accepted", label: `Accepted · ${counts.accepted}` },
                  { value: "closed", label: `Closed · ${counts.closed}` },
                ]}
                value={tab}
                onChange={setTab}
              />
            </div>

            {filtered.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--ink-400)",
                  fontSize: ".875rem",
                  padding: "32px 0",
                }}
              >
                No offers in this category.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((o) => {
                  const closed = isClosed(o.status);
                  const countered = o.status === "countered";
                  const accepted = o.status === "accepted";
                  const pending = o.status === "pending";
                  const expired =
                    (pending || countered) &&
                    o.expires &&
                    new Date(o.expires).getTime() <= Date.now();
                  const urgent = !expired && expiryUrgent(o.expires);
                  const save = accepted ? savings(o) : 0;

                  return (
                    <div
                      key={o.id}
                      style={{
                        background: closed ? "var(--line-50, #fafafa)" : "#fff",
                        border: `1.5px solid ${countered ? "var(--blue)" : closed ? "var(--line-100)" : "var(--line-200)"}`,
                        borderRadius: "var(--r-lg)",
                        padding: "12px 14px",
                        opacity: closed ? 0.75 : 1,
                        display: "grid",
                        gridTemplateColumns: "56px 1fr auto",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      {/* Thumbnail */}
                      <AppLink
                        href={pathFromScreen("pdp", o.p.id)}
                        onNavigate={() => openProduct(o.p)}
                        style={{ cursor: "pointer", textDecoration: "none", alignSelf: "center" }}
                      >
                        {o.p.img ? (
                          <img
                            src={o.p.img}
                            alt={o.p.name}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: "cover",
                              borderRadius: "var(--r-md)",
                              border: "1px solid var(--line-200)",
                            }}
                          />
                        ) : (
                          <Placeholder
                            icon={o.p.icon}
                            tint={o.p.tint}
                            style={{ width: 56, height: 56 }}
                            radius="var(--r-md)"
                          />
                        )}
                      </AppLink>

                      {/* Middle: negotiation story */}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: ".875rem",
                            color: "var(--ink-900)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o.p.name}
                          {o.variantName && (
                            <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>
                              {" "}
                              · {o.variantName}
                            </span>
                          )}
                        </div>

                        {/* Price comparison — the hero of each row */}
                        <div
                          className="tnum"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 4,
                            fontSize: ".8125rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "var(--ink-400)",
                            }}
                          >
                            {formatNPR(o.listed)}
                          </span>
                          <Icon name="arrowRight" size={12} color="var(--ink-300)" />
                          <span style={{ fontWeight: 700, color: "var(--blue-deep)" }}>
                            You offered {formatNPR(o.yourOffer)}
                          </span>
                          {countered && o.sellerCounter && (
                            <>
                              <Icon name="arrowRight" size={12} color="var(--ink-300)" />
                              <Chip tone="blue" size="sm">
                                Seller counters {formatNPR(o.sellerCounter)}
                              </Chip>
                            </>
                          )}
                          {accepted && save > 0 && (
                            <Chip tone="success" size="sm">
                              you save {formatNPR(save)}
                            </Chip>
                          )}
                          {accepted && (
                            <span style={{ fontWeight: 700, color: "var(--success)" }}>
                              {formatNPR(o.agreed ?? o.yourOffer)} agreed
                            </span>
                          )}
                        </div>

                        {/* Time / expiry line */}
                        <div
                          style={{
                            fontSize: ".75rem",
                            color: urgent
                              ? "var(--saffron)"
                              : expired
                                ? "var(--red)"
                                : "var(--ink-400)",
                            fontWeight: urgent || expired ? 600 : 400,
                            marginTop: 3,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Icon name="clock" size={12} color="currentColor" />
                          {expired ? (
                            "Offer expired — send a new one"
                          ) : o.status === "expired" ? (
                            o.expiryReason === "checkout_lock_expired" ? (
                              "Deal expired — wasn't checked out in time"
                            ) : o.attemptRefunded ? (
                              "Seller didn't respond in time"
                            ) : (
                              "Seller didn't respond in time"
                            )
                          ) : o.status === "rejected" ? (
                            "Declined — offer below seller's minimum"
                          ) : accepted ? (
                            <>
                              Price held for you
                              {bargainExpiryLabel(o.expires)
                                ? ` · ${bargainExpiryLabel(o.expires)}`
                                : ""}
                            </>
                          ) : (
                            <>
                              {o.age}
                              {bargainExpiryLabel(o.expires)
                                ? ` · ${urgent ? "⚠ " : ""}${bargainExpiryLabel(o.expires)}`
                                : ""}
                              {countered ? " · respond within this time" : ""}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right column: status badge + contextual action */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        <Chip tone={tones[o.status] ?? "neutral"} size="sm">
                          {labels[o.status] ?? o.status}
                        </Chip>

                        {accepted && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon="cart"
                            onClick={() =>
                              void addToCart(
                                o.p,
                                1,
                                `Added at bargained price · ${formatNPR(o.agreed ?? o.yourOffer)}`,
                                o.variantId,
                              )
                            }
                          >
                            Add to cart
                          </Button>
                        )}

                        {countered && !expired && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={acceptCounter.isPending}
                              onClick={async () => {
                                try {
                                  await acceptCounter.mutateAsync(o.id);
                                  toast.bargain(t("bargains.counterAccepted"));
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Could not accept the counter",
                                  );
                                }
                              }}
                            >
                              Accept · {formatNPR(o.sellerCounter)}
                            </Button>
                            <Button
                              variant="tertiary"
                              size="sm"
                              href={pathFromScreen("pdp", o.p.id)}
                              onNavigate={() => openProduct(o.p)}
                            >
                              Decline
                            </Button>
                          </div>
                        )}

                        {pending && !expired && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <Button
                              variant="tertiary"
                              size="sm"
                              href={pathFromScreen("pdp", o.p.id)}
                              onNavigate={() => openProduct(o.p)}
                            >
                              View product
                            </Button>
                          </div>
                        )}

                        {(o.status === "rejected" || o.status === "expired" || expired) && (
                          <Button
                            variant="bargain"
                            size="sm"
                            icon="bargain"
                            href={pathFromScreen("pdp", o.p.id)}
                            onNavigate={() => openProduct(o.p)}
                          >
                            Bargain again
                          </Button>
                        )}

                        {accepted && (
                          <Button
                            variant="tertiary"
                            size="sm"
                            href={pathFromScreen("pdp", o.p.id)}
                            onNavigate={() => openProduct(o.p)}
                          >
                            View product
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ApiState>
  );
}
