"use client";

import React, { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Button, Placeholder, EmptyState, AppLink } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { formatNPR } from "@/shared/lib/money";
import { toast } from "@/shared/lib/toast";
import { type SuborderStatus } from "@/shared/lib/order-utils";
import { useSellerInbox, useUpdateSellerOrderStatus } from "@/seller/hooks/use-seller";
import { useBz, BuyerAvatar } from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import { SellerHelpBar } from "../_shared/components";
import { inboxLabel, inboxTone, SELLER_ADVANCE } from "../_shared/inbox";
import { sellerOrderRef } from "../_shared/refs";
import { ConfirmModal } from "@/seller/components/confirm-modal";

/* ---------- 4.3b Order detail — full-screen, one big action ---------- */
export function SellerOrderDetail() {
  const { t } = useTranslation();
  const { nav } = useBz();
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
          title={t("seller.orderDetail.noOrderTitle")}
          message={t("seller.orderDetail.noOrderMessage")}
          cta={t("seller.orderDetail.backToOrders")}
          ctaHref={pathFromScreen("s-inbox")}
        />
      </div>
    );
  }

  // Label keyed by the TARGET status — mirrors SELLER_ADVANCE (which mirrors the
  // orders service ALLOWED_SELLER_TRANSITIONS).
  const advanceLabel: Record<string, string> = {
    seller_processing: t("seller.orderDetail.actionStartProcessing"),
    ready_for_hub: t("seller.orderDetail.actionMarkReadyForHub"),
    on_the_way_to_hub: t("seller.orderDetail.actionSendToHub"),
    received_at_hub: t("seller.orderDetail.actionMarkReceivedAtHub"),
    verified: t("seller.orderDetail.actionMarkVerified"),
    packed: t("seller.orderDetail.actionMarkPacked"),
    issue_found: t("seller.orderDetail.actionReportIssue"),
  };
  const [advancePrimary, advanceSecondary] = SELLER_ADVANCE[o.status] ?? [];

  const moveOrder = async (status: SuborderStatus) => {
    try {
      const updated = await updateStatus.mutateAsync({ id: o.id, status });
      sellerOrderRef.current = updated;
      toast.success(
        t("seller.orderDetail.statusUpdated", { id: o.id, status: inboxLabel(status).en }),
      );
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
          <SellerIcon name="chevronLeft" size={16} /> {t("seller.orderDetail.backToOrders")}
        </AppLink>

        {(() => {
          // Banner colour follows the status tone (single source of truth in
          // INBOX_TONE), so every SuborderStatus stays in sync automatically.
          const blueBanner = {
            bg: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
            border: "var(--blue)",
            color: "var(--blue)",
          };
          const toneBanner: Record<string, { bg: string; border: string; color: string }> = {
            blue: blueBanner,
            saffron: {
              bg: "linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)",
              border: "var(--saffron)",
              color: "var(--saffron)",
            },
            success: {
              bg: "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)",
              border: "var(--success)",
              color: "var(--success)",
            },
            red: {
              bg: "linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)",
              border: "var(--danger)",
              color: "var(--danger)",
            },
            neutral: {
              bg: "linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%)",
              border: "var(--ink-300)",
              color: "var(--ink-500)",
            },
          };
          const b = toneBanner[inboxTone(o.status)] ?? blueBanner;
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
                  {inboxLabel(o.status).en}
                </div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>
                  {o.time} · {t("seller.orderDetail.orderNumber", { id: o.id })}
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
            {t("seller.orderDetail.buyer")}
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
            {t("seller.orderDetail.item")}
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Placeholder icon={o.icon} style={{ width: 70, height: 70 }} radius="var(--r-md)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{o.item}</div>
              <div
                className="tnum"
                style={{ fontSize: ".875rem", color: "var(--ink-500)", marginTop: 2 }}
              >
                {t("seller.orderDetail.qty", { count: o.qty })}
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
            {t("seller.orderDetail.payment")}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "var(--ink-700)" }}>{t("seller.orderDetail.buyerPays")}</span>
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
            <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>
              {t("seller.orderDetail.youGet")}
            </span>
            <span
              className="tnum"
              style={{ fontWeight: 600, fontSize: "1.375rem", color: "var(--success)" }}
            >
              {formatNPR(o.price)}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--ink-500)" }}>
            {t("seller.orderDetail.method", { method: o.pay })}
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
            <SellerIcon name="check" size={18} /> {t("seller.orderDetail.awaitingOtherSellers")}
          </div>
        ) : advancePrimary ? (
          <>
            <Button
              variant="primary"
              size="md"
              full
              loading={updateStatus.isPending}
              onClick={() => void moveOrder(advancePrimary)}
              icon="check"
            >
              {advanceLabel[advancePrimary]}
            </Button>
            {advanceSecondary && (
              <Button
                variant="ghost"
                size="md"
                full
                disabled={updateStatus.isPending}
                onClick={() => void moveOrder(advanceSecondary)}
                icon="alertCircle"
                style={{ marginTop: 8 }}
              >
                {advanceLabel[advanceSecondary]}
              </Button>
            )}
          </>
        ) : (
          <Button variant="ghost" size="md" full disabled>
            {inboxLabel(o.status).en}
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
            {t("seller.orderDetail.cantFulfill")}
          </button>
        )}

        <ConfirmModal
          open={cancelOpen}
          pending={updateStatus.isPending}
          icon="package"
          title={t("seller.orderDetail.cancelTitle")}
          message={
            <Trans
              i18nKey="seller.orderDetail.cancelMessage"
              values={{ id: o.id, buyer: o.buyer }}
              components={{ strong: <strong /> }}
            />
          }
          confirmLabel={t("seller.orderDetail.cancelConfirm")}
          cancelLabel={t("seller.orderDetail.cancelKeep")}
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
