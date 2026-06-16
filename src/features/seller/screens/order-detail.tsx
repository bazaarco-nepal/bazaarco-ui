"use client";

import React, { useState } from "react";
import { Button, Placeholder, EmptyState, AppLink } from "@/components/ui";
import { SellerIcon } from "../_shared/icons";
import { formatNPR } from "@/lib/money";
import { type OrderStatus } from "@/lib/order-utils";
import { useSellerInbox, useUpdateSellerOrderStatus } from "@/hooks/use-seller";
import { useBz, BuyerAvatar } from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import { SellerHelpBar } from "../_shared/components";
import { INBOX_LABEL } from "../_shared/inbox";
import { sellerOrderRef } from "../_shared/refs";
import { ConfirmModal } from "@/components/seller/confirm-modal";

/* ---------- 4.3b Order detail — full-screen, one big action ---------- */
export function SellerOrderDetail() {
  const { nav, toast } = useBz();
  const { data: inboxOrders = [] } = useSellerInbox();
  const o = sellerOrderRef.current || inboxOrders[0];
  const updateStatus = useUpdateSellerOrderStatus();
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!o) {
    return (
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--seller-max, var(--container))",
          margin: "0 auto",
          padding: "20px 28px 100px",
        }}
      >
        <EmptyState
          icon="package"
          title="No order selected"
          message="Open an order from the seller orders list."
          cta="Back to orders"
          ctaHref={pathFromScreen("s-inbox")}
        />
      </div>
    );
  }

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    placed: "accepted",
    accepted: "packaging_started",
    packaging_started: "ready_for_pickup",
    ready_for_pickup: "picked_up",
    picked_up: "arrived_at_hub",
    arrived_at_hub: "out_for_delivery",
    out_for_delivery: "delivered",
  };

  const nextLabel: Partial<Record<OrderStatus, string>> = {
    placed: "Accept order",
    accepted: "Start packaging",
    packaging_started: "Mark ready for pickup",
    ready_for_pickup: "Mark picked up",
    picked_up: "Mark arrived at hub",
    arrived_at_hub: "Mark out for delivery",
    out_for_delivery: "Mark delivered",
  };

  const moveOrder = async (status: OrderStatus) => {
    try {
      const updated = await updateStatus.mutateAsync({ id: o.id, status });
      sellerOrderRef.current = updated;
      toast(`Order ${o.id} updated to ${INBOX_LABEL[status].en}`);
      nav("s-inbox");
    } catch {
      /* API layer surfaces the error */
    }
  };

  const reject = () => {
    if (!o.canCancel) return;
    setCancelOpen(true);
  };

  return (
    <div
      className="bz-container-pad"
      style={{
        maxWidth: "var(--seller-max, var(--container))",
        margin: "0 auto",
        padding: "20px 28px 100px",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <SellerHelpBar />

        <AppLink
          href={pathFromScreen("s-inbox")}
          className="bz-back-link bz-hover-tint"
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
            padding: "4px 8px",
            borderRadius: "var(--r-sm)",
            fontSize: ".875rem",
            textDecoration: "none",
          }}
        >
          <SellerIcon name="chevronLeft" size={16} /> Back to orders
        </AppLink>

        {(() => {
          const bannerMap: Record<string, { bg: string; border: string; color: string }> = {
            placed: {
              bg: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
              border: "var(--blue)",
              color: "var(--blue)",
            },
            accepted: {
              bg: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
              border: "var(--blue)",
              color: "var(--blue)",
            },
            packaging_started: {
              bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
              border: "var(--saffron)",
              color: "var(--saffron)",
            },
            ready_for_pickup: {
              bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
              border: "var(--saffron)",
              color: "var(--saffron)",
            },
            picked_up: {
              bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
              border: "var(--saffron)",
              color: "var(--saffron)",
            },
            arrived_at_hub: {
              bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
              border: "var(--saffron)",
              color: "var(--saffron)",
            },
            out_for_delivery: {
              bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
              border: "var(--saffron)",
              color: "var(--saffron)",
            },
            delivered: {
              bg: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
              border: "var(--success)",
              color: "var(--success)",
            },
            cancelled: {
              bg: "linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)",
              border: "var(--danger)",
              color: "var(--danger)",
            },
          };
          const fallback = {
            bg: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
            border: "var(--blue)",
            color: "var(--blue)",
          };
          const b = bannerMap[o.status] ?? fallback;
          return (
            <div
              style={{
                background: b.bg,
                border: `2px solid ${b.border}`,
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <SellerIcon name="package" size={32} color={b.color} />
              <div>
                <div style={{ fontWeight: 600, color: b.color, fontSize: "1rem" }}>
                  {INBOX_LABEL[o.status].en}
                </div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>
                  {o.time} · Order #{o.id}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Buyer */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 8,
            }}
          >
            Buyer
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BuyerAvatar
              src={o.buyerAvatarUrl}
              name={o.buyer}
              size={56}
              fontSize="1.5rem"
              style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "1.0625rem" }}>{o.buyer}</div>
              <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>{o.city}</div>
            </div>
            <a
              href={`tel:${o.phone}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--success)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <SellerIcon name="phone" size={22} color="#fff" />
            </a>
          </div>
        </div>

        {/* Item */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 8,
            }}
          >
            Item
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Placeholder
              icon={o.icon}
              tint={o.tint}
              style={{ width: 70, height: 70 }}
              radius="var(--r-md)"
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{o.item}</div>
              <div
                className="tnum"
                style={{ fontSize: ".875rem", color: "var(--ink-500)", marginTop: 2 }}
              >
                Qty {o.qty}
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 10,
            }}
          >
            Payment
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--ink-700)" }}>Buyer pays</span>
            <span
              className="tnum"
              style={{ fontWeight: 600, fontSize: "1.25rem", color: "var(--ink-900)" }}
            >
              {formatNPR(o.price)}
            </span>
          </div>
          <div
            style={{
              paddingTop: 10,
              borderTop: "1px dashed var(--line-200)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>You get</span>
            <span
              className="tnum"
              style={{ fontWeight: 600, fontSize: "1.375rem", color: "var(--success)" }}
            >
              {formatNPR(o.price)}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--ink-500)" }}>
            Method: {o.pay}
          </div>
        </div>

        {/* Status actions */}
        {o.awaitingOtherSellers ? (
          <div
            style={{
              background: "var(--tint-blue-50)",
              border: "1.5px solid var(--blue)",
              borderRadius: "var(--r-lg)",
              padding: 16,
              textAlign: "center",
              color: "var(--ink-900)",
              fontWeight: 600,
            }}
          >
            <SellerIcon name="check" size={18} /> Accepted — waiting for other sellers to confirm
          </div>
        ) : nextStatus[o.status] ? (
          <Button
            variant="primary"
            size="md"
            full
            loading={updateStatus.isPending}
            onClick={() => void moveOrder(nextStatus[o.status]!)}
            icon="check"
          >
            {nextLabel[o.status]}
          </Button>
        ) : (
          <Button variant="ghost" size="md" full disabled>
            {INBOX_LABEL[o.status].en}
          </Button>
        )}
        {o.canCancel && (
          <button
            type="button"
            disabled={updateStatus.isPending}
            onClick={reject}
            style={{
              marginTop: 10,
              width: "auto",
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
              fontSize: ".8125rem",
              fontWeight: 600,
              color: "var(--danger)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Can't fulfill this order
          </button>
        )}

        <ConfirmModal
          open={cancelOpen}
          pending={updateStatus.isPending}
          icon="package"
          title="Cancel this order?"
          message={
            <>
              Order <strong>#{o.id}</strong> for <strong>{o.buyer}</strong> will be cancelled. The
              buyer will be notified and refunded. This cannot be undone.
            </>
          }
          confirmLabel="Cancel order"
          cancelLabel="Keep order"
          onConfirm={() => {
            setCancelOpen(false);
            void moveOrder("cancelled");
          }}
          onCancel={() => setCancelOpen(false)}
        />
      </div>
    </div>
  );
}
