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
import { useWishlistQuery } from "@/hooks/use-wishlist";
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
      {order?.eta && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".05em",
            }}
          >
            Estimated delivery
          </div>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--blue-deep)",
              marginTop: 4,
            }}
          >
            {order.eta}
          </div>
        </div>
      )}
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
        variant="ghost"
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

export function Wishlist() {
  const { t } = useTranslation();
  const { nav, openProduct, toggleSellerWish, wishSellers, authed } = useBz();
  const { data, isLoading, isError, error } = useWishlistQuery(authed);
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
          title={t("wishlist.signInTitle")}
          message={t("wishlist.signInMessage")}
          cta={t("wishlist.signIn")}
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
          title={t("wishlist.emptyTitle")}
          message={t("wishlist.emptyMessage")}
          cta={t("wishlist.startExploring")}
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
          {t("wishlist.myWishlist")}
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
          {t("profile.wishlist")}{" "}
          <span
            className="tnum"
            style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: "1rem" }}
          >
            · {t("wishlist.savedCount", { count: totalSaved })}
          </span>
        </h1>

        {sellers.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.125rem", fontWeight: 700 }}>
              {t("wishlist.savedSellers")}
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
                    saved={wishSellers.includes(s.id)}
                    onToggleSave={(id) => {
                      void toggleSellerWish(id);
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.125rem", fontWeight: 700 }}>
              {t("wishlist.savedProducts")}
            </h2>
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
  const { nav, openProduct, addToCart, toast } = useBz();
  const { data: offers = [], isLoading, isError, error } = useBargains();
  const acceptCounter = useAcceptCounterOffer();

  const tones = {
    pending: "saffron",
    countered: "blue",
    accepted: "success",
    rejected: "neutral",
  };
  const labels = {
    pending: t("bargains.statusPending"),
    countered: t("bargains.statusCountered"),
    accepted: t("bargains.statusAccepted"),
    rejected: t("bargains.statusDeclined"),
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "28px 28px 96px" }}
      >
        <div style={{ marginBottom: 20 }}>
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
          <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
            {t("bargains.subtitle")}
          </p>
        </div>

        {offers.length === 0 ? (
          <EmptyState
            title={t("bargains.emptyTitle")}
            message={t("bargains.emptyMessage")}
            cta={t("bargains.browseProducts")}
            ctaHref={searchPath()}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {offers.map((o) => (
              <div
                key={o.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <AppLink
                    href={pathFromScreen("pdp", o.p.id)}
                    onNavigate={() => openProduct(o.p)}
                    style={{ cursor: "pointer", flexShrink: 0, textDecoration: "none" }}
                  >
                    {o.p.img ? (
                      <img
                        src={o.p.img}
                        alt={o.p.name}
                        style={{
                          width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: "var(--r-md)",
                        }}
                      />
                    ) : (
                      <Placeholder
                        icon={o.p.icon}
                        tint={o.p.tint}
                        style={{ width: 72, height: 72 }}
                        radius="var(--r-md)"
                      />
                    )}
                  </AppLink>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: ".9375rem",
                          color: "var(--ink-900)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
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
                      <Chip tone={tones[o.status] ?? "neutral"} size="sm">
                        {labels[o.status] ?? o.status}
                      </Chip>
                    </div>
                    <div
                      className="tnum"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 14,
                        fontSize: ".8125rem",
                        marginTop: 8,
                      }}
                    >
                      <span>
                        <span style={{ color: "var(--ink-400)" }}>Listed:</span>{" "}
                        <span style={{ textDecoration: "line-through", color: "var(--ink-500)" }}>
                          {formatNPR(o.listed)}
                        </span>
                      </span>
                      <span>
                        <span style={{ color: "var(--ink-400)" }}>Your offer:</span>{" "}
                        <b style={{ color: "var(--blue-deep)" }}>{formatNPR(o.yourOffer)}</b>
                      </span>
                      {o.sellerCounter && (
                        <span>
                          <span style={{ color: "var(--ink-400)" }}>Counter:</span>{" "}
                          <b style={{ color: "var(--red)" }}>{formatNPR(o.sellerCounter)}</b>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
                      {o.age}
                      {(o.status === "pending" || o.status === "countered") &&
                      o.expires &&
                      new Date(o.expires).getTime() <= Date.now() ? (
                        <span style={{ color: "var(--red)", fontWeight: 600 }}>
                          {" "}
                          · Offer expired — send a new one
                        </span>
                      ) : bargainExpiryLabel(o.expires) ? (
                        ` · ${bargainExpiryLabel(o.expires)}`
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {o.status === "accepted" && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon="cart"
                      onClick={() =>
                        // No price in the payload — the server binds the accepted
                        // offer to this (product, variant) line at the agreed price.
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
                  {o.status === "countered" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={acceptCounter.isPending}
                        onClick={async () => {
                          // Accepting server-side is what locks the price for
                          // checkout — a toast alone never bound the deal.
                          try {
                            await acceptCounter.mutateAsync(o.id);
                            toast(t("bargains.counterAccepted"));
                          } catch (err) {
                            toast(
                              err instanceof Error ? err.message : "Could not accept the counter",
                              "error",
                            );
                          }
                        }}
                      >
                        Accept {formatNPR(o.sellerCounter)}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        href={pathFromScreen("pdp", o.p.id)}
                        onNavigate={() => openProduct(o.p)}
                      >
                        Counter back
                      </Button>
                    </>
                  )}
                  {o.status === "rejected" && (
                    <span
                      style={{
                        fontSize: ".8125rem",
                        color: "var(--ink-500)",
                        alignSelf: "center",
                      }}
                    >
                      Raise your price a bit and offer again.
                    </span>
                  )}
                  {o.status !== "accepted" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      href={pathFromScreen("pdp", o.p.id)}
                      onNavigate={() => openProduct(o.p)}
                    >
                      View product
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {offers.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Button variant="secondary" full icon="bargain" href={searchPath()}>
              Find products to bargain on
            </Button>
          </div>
        )}
      </div>
    </ApiState>
  );
}
