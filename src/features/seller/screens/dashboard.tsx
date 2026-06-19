"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Chip,
  Placeholder,
  TINTS,
  ChipGroup,
  ApiState,
  AppLink,
  StoreAvatar,
} from "@/components/ui";
import { SellerIcon } from "../_shared/icons";
import { useCompleteOnboarding } from "@/hooks/use-auth";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName } from "@/lib/display";
import { formatNPR } from "@/lib/money";
import {
  useSellerDashboard,
  useSellerInbox,
  useSellerInventory,
  useSellerOrganization,
  useUpdateStoreHandle,
} from "@/hooks/use-seller";
import { useBz, BuyerAvatar } from "@/components/common";
import { useChatInbox } from "@/hooks/use-chat";
import { pathFromScreen, storeShareUrl } from "@/config/routes";
import { SellerBarChart, SellerSparkline } from "../_shared/charts";
import {
  SellerHelpBar,
  SelectMenu,
  SellerEmptyState,
  SellerPage,
  Card,
  MetricGrid,
  Metric,
} from "../_shared/components";
import { type SellerInboxOrderItem } from "../_shared/types";

/**
 * Seller's public storefront link — the one thing a seller most wants to hand
 * out. Shows the shop identity, the readable URL, and one primary action
 * (native share, copy fallback). Renders nothing until we know the seller's id.
 */
function StoreLinkCard() {
  const { t } = useTranslation();
  const { toast } = useBz();
  const { data: organization } = useSellerOrganization();
  const updateHandle = useUpdateStoreHandle();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftHandle, setDraftHandle] = useState("");

  // window.location.origin is client-only; pass "" on the server render so the
  // first client render matches it (no hydration mismatch), then fill it in.
  useEffect(() => {
    setOrigin(window.location.origin.replace(/\/$/, ""));
  }, []);

  const sellerId = organization?.sellerId;
  if (!sellerId) return null;

  // The handle is the readable URL segment; older stores without one fall back
  // to the UUID, which the public resolver still accepts.
  const handle = organization?.slug ?? sellerId;
  const shopName = organization?.shopName?.trim() || "BazaarCo";
  const fullUrl = storeShareUrl(handle, origin);
  const displayUrl = fullUrl.replace(/^https?:\/\//, "");
  const logoUrl = organization?.logoUrl;
  const isLive = organization?.verification?.canSell ?? false;

  const startEditing = () => {
    setDraftHandle(organization?.slug ?? "");
    setIsEditing(true);
  };

  const saveHandle = () => {
    const next = draftHandle.trim();
    if (!next || next === organization?.slug) {
      setIsEditing(false);
      return;
    }
    updateHandle.mutate(next, {
      onSuccess: () => {
        setIsEditing(false);
        toast(t("seller.dashboard.storeLinkSaved"));
      },
      onError: (err) => {
        const token = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
        if (token === "STORE_HANDLE_TAKEN") toast(t("seller.dashboard.storeLinkTaken"));
        else if (token === "INVALID_STORE_HANDLE") toast(t("seller.dashboard.storeLinkInvalid"));
        else toast(t("seller.dashboard.storeLinkSaveError"));
      },
    });
  };

  const copyLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast(t("seller.dashboard.storeLinkShareUnsupported"));
      return;
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast(t("seller.dashboard.storeLinkCopyToast"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t("seller.dashboard.storeLinkShareError"));
    }
  };

  // Native share sheet when available, copy-to-clipboard otherwise.
  const shareStore = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shopName,
          text: t("seller.dashboard.storeLinkShareText", { shop: shopName }),
          url: fullUrl,
        });
      } catch (err) {
        // User dismissing the native sheet throws AbortError — ignore it.
        if (err instanceof Error && err.name === "AbortError") return;
        toast(t("seller.dashboard.storeLinkShareError"));
      }
      return;
    }
    void copyLink();
  };

  return (
    <section className="bz-store-link" aria-label={t("seller.dashboard.storeLinkLabel")}>
      <div className="bz-store-link__head">
        <StoreAvatar src={logoUrl} name={shopName} size={48} />

        <div className="bz-store-link__id">
          <strong className="bz-store-link__name">{shopName}</strong>
          <div className="bz-store-link__meta">
            <span className={"bz-store-link__badge" + (isLive ? " is-live" : " is-pending")}>
              {isLive
                ? t("seller.dashboard.storeLinkLive")
                : t("seller.dashboard.storeLinkPending")}
            </span>
            <span className="bz-store-link__on">{t("seller.dashboard.storeLinkOnBazaar")}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="bz-store-link__share"
          onClick={shareStore}
          icon="share"
        >
          {t("seller.dashboard.storeLinkShare")}
        </Button>
      </div>

      <hr className="bz-store-link__divider" />

      {isEditing ? (
        <div className="bz-store-link__edit">
          <div className="bz-store-link__edit-field">
            <span className="bz-store-link__edit-prefix">
              {origin.replace(/^https?:\/\//, "")}/store/
            </span>
            <input
              className="bz-store-link__edit-input"
              value={draftHandle}
              onChange={(e) => setDraftHandle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveHandle();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
              spellCheck={false}
              aria-label={t("seller.dashboard.storeLinkEdit")}
            />
          </div>
          <p className="bz-store-link__edit-hint">{t("seller.dashboard.storeLinkEditHint")}</p>
          <div className="bz-store-link__edit-actions">
            <Button
              variant="primary"
              size="sm"
              onClick={saveHandle}
              disabled={updateHandle.isPending}
            >
              {t("seller.dashboard.storeLinkSave")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={updateHandle.isPending}
            >
              {t("seller.dashboard.storeLinkCancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bz-store-link__pill">
          <a
            className="bz-store-link__url"
            href={fullUrl}
            target="_blank"
            rel="noreferrer noopener"
            title={displayUrl}
          >
            {displayUrl}
          </a>
          <button type="button" className="bz-store-link__edit-btn" onClick={startEditing}>
            <SellerIcon name="edit" size={14} />
            {t("seller.dashboard.storeLinkEdit")}
          </button>
          <button
            type="button"
            className={"bz-store-link__copy" + (copied ? " is-copied" : "")}
            onClick={copyLink}
          >
            <SellerIcon name={copied ? "check" : "copy"} size={14} />
            {copied ? t("seller.dashboard.storeLinkCopied") : t("seller.dashboard.storeLinkCopy")}
          </button>
        </div>
      )}
    </section>
  );
}

export function SellerDashboard() {
  const { t } = useTranslation();
  const { nav, toast } = useBz();
  const user = useBazaarStore((s) => s.user);
  const setUser = useBazaarStore((s) => s.setUser);
  const completeOnboardingMutation = useCompleteOnboarding();
  const [range, setRange] = useState("week");
  const { data: dashboard, isLoading, isError, error } = useSellerDashboard(range);
  const { data: inbox = [] } = useSellerInbox();
  const { data: inventory = [] } = useSellerInventory();
  const { data: chatInbox } = useChatInbox();
  const chatThreads = chatInbox?.threads ?? [];
  const unreadChats = chatThreads.filter((ct) => (ct.unread ?? 0) > 0);
  const totalUnread = unreadChats.reduce((sum, ct) => sum + (ct.unread ?? 0), 0);
  const rangeLabel =
    range === "today"
      ? t("seller.common.today")
      : range === "month"
        ? t("seller.common.month30")
        : t("seller.common.week7");

  // Onboarding coachmark removed — silently mark onboarding complete the first
  // time a seller lands here so backend state stays consistent. No popup shown.
  useEffect(() => {
    if (user?.intent === "seller" && user.onBoarding === false) {
      completeOnboardingMutation.mutate(undefined, {
        onSuccess: (updated) => setUser(updated),
        onError: () => {
          setUser(user ? { ...user, onBoarding: true } : user);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.intent, user?.onBoarding]);

  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    );
  }, []);

  const salesByDay = dashboard?.salesByDay ?? [];
  const paymentSplit = dashboard?.paymentSplit ?? [];
  const funnel = dashboard?.funnel ?? [];
  const topProducts = dashboard?.topProducts ?? [];
  const activity = dashboard?.activity ?? [];
  const kpis = dashboard?.kpis ?? [];
  const bargainGlance = dashboard?.bargainGlance;
  const trust = (
    dashboard as
      | {
          trust?: {
            ordersThisWeek?: number;
            storeRating?: number;
            ratingCount?: number;
            onTimeShipPct?: number | null;
            repeatBuyerPct?: number;
          };
        }
      | undefined
  )?.trust;
  const trustStrip = trust
    ? [
        {
          k:
            range === "today"
              ? t("seller.dashboard.ordersToday")
              : t("seller.dashboard.ordersRange", { range: rangeLabel }),
          v: String(trust.ordersThisWeek ?? 0),
          c: "var(--blue-deep)",
        },
        {
          k: t("seller.dashboard.storeRating"),
          v:
            (trust.ratingCount ?? 0) > 0
              ? `${Number(trust.storeRating).toFixed(1)} ★`
              : t("seller.dashboard.ratingNew"),
          c: "var(--gold)",
        },
        {
          k: t("seller.dashboard.onTimeShip"),
          v: trust.onTimeShipPct == null ? "—" : `${trust.onTimeShipPct}%`,
          c: "var(--success)",
        },
        {
          k: t("seller.dashboard.repeatBuyers"),
          v: (trust.ordersThisWeek ?? 0) > 0 ? `${trust.repeatBuyerPct ?? 0}%` : "—",
          c: "var(--saffron)",
        },
      ]
    : [];
  const ownerName = displayName(user, "Seller");
  const todaySales = kpis[0]?.value ?? "Rs. 0";
  const ordersPlaced = funnel.length > 0 ? (funnel[funnel.length - 1]?.value ?? 0) : 0;
  const pendingOrders = inbox.filter(
    (o: SellerInboxOrderItem) => o.status === "placed" && !o.awaitingOtherSellers,
  ).length;
  const lowStock = inventory.filter((i: { stock?: number }) => (i.stock ?? 0) <= 3).length;
  const frozenListings = inventory.filter(
    (i: { listingStatus?: string }) => i.listingStatus === "frozen",
  );
  const pendingReview = inventory.filter(
    (i: { listingStatus?: string }) => i.listingStatus === "pending_reinstatement",
  );
  const tasks = [
    frozenListings.length > 0 && {
      icon: "lock",
      tint: "red",
      label:
        frozenListings.length === 1
          ? t("seller.dashboard.taskFrozen", { count: frozenListings.length })
          : t("seller.dashboard.taskFrozen_plural", { count: frozenListings.length }),
      to: "s-products",
      urgent: true,
      action: { label: t("seller.common.viewProducts"), onAct: () => nav("s-products") },
    },
    pendingReview.length > 0 && {
      icon: "clock",
      tint: "saffron",
      label:
        pendingReview.length === 1
          ? t("seller.dashboard.taskPendingReview", { count: pendingReview.length })
          : t("seller.dashboard.taskPendingReview_plural", { count: pendingReview.length }),
      to: "s-products",
      urgent: false,
      action: { label: t("seller.common.viewStatus"), onAct: () => nav("s-products") },
    },
    pendingOrders > 0 && {
      icon: "package",
      tint: "red",
      label:
        pendingOrders === 1
          ? t("seller.dashboard.taskNewOrders", { count: pendingOrders })
          : t("seller.dashboard.taskNewOrders_plural", { count: pendingOrders }),
      to: "s-inbox",
      urgent: true,
      action: { label: t("seller.common.viewOrders"), onAct: () => nav("s-inbox") },
    },
    totalUnread > 0 && {
      icon: "message",
      tint: "blue",
      label:
        unreadChats.length === 1
          ? `${totalUnread} unread message from ${unreadChats[0]?.buyer ?? "a buyer"}`
          : `${totalUnread} unread messages from ${unreadChats.length} buyers`,
      to: "s-chat",
      urgent: true,
      action: { label: "Reply", onAct: () => nav("s-chat") },
    },
    lowStock > 0 && {
      icon: "zap",
      tint: "saffron",
      label:
        lowStock === 1
          ? t("seller.dashboard.taskLowStock", { count: lowStock })
          : t("seller.dashboard.taskLowStock_plural", { count: lowStock }),
      to: "s-products",
      urgent: false,
      action: { label: t("seller.common.restock"), onAct: () => nav("s-products") },
    },
  ].filter(
    (
      task,
    ): task is {
      icon: string;
      tint: string;
      label: string;
      to: string;
      urgent: boolean;
      action: { label: string; onAct: () => void };
    } => Boolean(task),
  );

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <SellerPage>
        <SellerHelpBar />

        {frozenListings.length > 0 && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: "16px 18px",
              borderRadius: "var(--r-md)",
              border: "2px solid var(--red)",
              background: "rgba(230,57,70,.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <SellerIcon name="lock" size={20} color="var(--red)" style={{ flexShrink: 0 }} />
              <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--red)" }}>
                {frozenListings.length === 1
                  ? t("seller.dashboard.frozenTitle", { count: frozenListings.length })
                  : t("seller.dashboard.frozenTitle_plural", { count: frozenListings.length })}
              </div>
            </div>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: ".875rem",
                color: "var(--ink-700)",
                lineHeight: 1.5,
              }}
            >
              {t("seller.dashboard.frozenHint")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {frozenListings.map((fl) => (
                <div
                  key={fl.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--r-sm)",
                    background: "rgba(230,57,70,.06)",
                    border: "1px solid rgba(230,57,70,.25)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: ".8125rem",
                      color: "var(--ink-900)",
                      marginBottom: 4,
                    }}
                  >
                    {fl.name}
                  </div>
                  {fl.moderationFeedback && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: ".8125rem",
                        color: "var(--ink-700)",
                        lineHeight: 1.45,
                      }}
                    >
                      {fl.moderationFeedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="sm"
              style={{ marginTop: 12 }}
              onClick={() => nav("s-products")}
            >
              {t("seller.common.reviewProducts")}
            </Button>
          </div>
        )}

        {/* Greeting + range */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--ink-900)",
              }}
            >
              {t("seller.dashboard.greeting", { name: ownerName })}{" "}
              <span style={{ fontSize: "1.5rem" }}>🙏</span>
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
              {today}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SelectMenu
              value={range}
              onChange={setRange}
              icon="clock"
              ariaLabel={t("seller.dashboard.dateRange")}
              options={[
                { value: "today", label: t("seller.common.today") },
                { value: "week", label: t("seller.common.week7") },
                { value: "month", label: t("seller.common.month30") },
              ]}
            />
          </div>
        </div>

        {/* Shareable public storefront link */}
        <StoreLinkCard />

        {/* KPI strip — plain language, no jargon */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {kpis.length === 0 && (
            <SellerEmptyState
              style={{ gridColumn: "1 / -1" }}
              icon="trendingUp"
              title={t("seller.dashboard.noSalesYet")}
              message={t("seller.dashboard.noSalesMetricsMessage")}
            />
          )}
          {kpis.map((k) => (
            <div key={k.label} className="bz-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  className="bz-icon-tile"
                  style={{
                    background: `color-mix(in srgb, ${k.color ?? "var(--blue)"} 14%, #fff)`,
                    color: k.color ?? "var(--blue)",
                  }}
                >
                  <SellerIcon name="trendingUp" size={18} />
                </span>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                    fontWeight: 600,
                  }}
                >
                  {k.label}
                </div>
                {k.delta && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      fontSize: ".6875rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      padding: "2px 7px",
                      borderRadius: 999,
                      color: k.up ? "var(--success)" : "var(--danger)",
                      background: k.up
                        ? "color-mix(in srgb, var(--success) 12%, #fff)"
                        : "color-mix(in srgb, var(--danger) 12%, #fff)",
                    }}
                  >
                    <SellerIcon name={k.up ? "trendingUp" : "trendingDown"} size={11} />
                    {k.delta}
                  </span>
                )}
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  color: "var(--ink-900)",
                  lineHeight: 1.1,
                  marginBottom: 8,
                }}
              >
                {k.value}
              </div>
              <SellerSparkline data={k.spark ?? []} color={k.color} />
              {k.couriers && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px dashed var(--line-200)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {k.couriers.map((c: { name: string; to: string; amount: string }) => (
                    <AppLink
                      key={c.name}
                      href={pathFromScreen(c.to)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: "4px 0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: ".75rem",
                          fontWeight: 600,
                          color: "var(--ink-700)",
                        }}
                      >
                        <SellerIcon name="truck" size={14} color="var(--blue)" />
                        {c.name}
                      </span>
                      <span
                        className="tnum"
                        style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--ink-900)" }}
                      >
                        {c.amount}
                      </span>
                    </AppLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hero earnings + tasks side-by-side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
          className="bz-seller-grid bz-stack-900"
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 26,
              boxShadow: "var(--sh-1)",
            }}
          >
            <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", fontWeight: 600 }}>
              {range === "today"
                ? t("seller.dashboard.earningsToday")
                : t("seller.dashboard.earningsRange", { range: rangeLabel })}
            </div>
            <div
              className="tnum bz-stat-xl"
              style={{
                fontWeight: 600,
                margin: "6px 0 4px",
                letterSpacing: "-.02em",
                color: "var(--ink-900)",
              }}
            >
              {todaySales}
            </div>
            <div
              style={{
                fontSize: ".8125rem",
                color: "var(--ink-400)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <SellerIcon name="wallet" size={14} color="var(--success)" />{" "}
              {t("seller.dashboard.fromDashboard")}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginTop: 20,
              }}
            >
              {[
                { k: t("seller.dashboard.orders"), v: String(ordersPlaced) },
                { k: t("seller.dashboard.toPack"), v: String(kpis[1]?.value ?? "0") },
                { k: t("seller.dashboard.returns"), v: "0" },
              ].map((s) => (
                <div
                  key={s.k}
                  style={{
                    background: "var(--line-100)",
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    className="tnum"
                    style={{ fontWeight: 600, fontSize: "1.125rem", color: "var(--ink-900)" }}
                  >
                    {s.v}
                  </div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>{s.k}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--line-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: ".9375rem", color: "var(--ink-900)" }}>
                {t("seller.dashboard.todaysTasks")}
              </div>
              {tasks.length > 0 ? (
                <Chip tone="red" size="sm">
                  {t("seller.dashboard.tasksToDo", { count: tasks.length })}
                </Chip>
              ) : (
                <Chip size="sm">{t("seller.dashboard.allClear")}</Chip>
              )}
            </div>
            {tasks.length === 0 && (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "var(--ink-500)",
                  fontSize: ".875rem",
                }}
              >
                {t("seller.dashboard.noPendingTasks")}
              </div>
            )}
            {tasks.map((t) => (
              <div
                key={t.label}
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: "#fff",
                  borderTop: "1px solid var(--line-200)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {/* Stretched link overlay → open-in-new-tab; nested action button
                    sits above it via z-index. */}
                <AppLink
                  href={pathFromScreen(t.to)}
                  onNavigate={() => nav(t.to)}
                  ariaLabel={t.label}
                  style={{ position: "absolute", inset: 0, zIndex: 1 }}
                />
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--r-md)",
                    background: TINTS[t.tint as keyof typeof TINTS][0],
                    color: TINTS[t.tint as keyof typeof TINTS][2],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <SellerIcon
                    name={t.icon}
                    size={20}
                    color={TINTS[t.tint as keyof typeof TINTS][2]}
                  />
                  {t.urgent && (
                    <span
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "var(--danger)",
                        border: "2px solid #fff",
                      }}
                    />
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".875rem" }}>{t.label}</div>
                </div>
                {t.action ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      t.action.onAct();
                    }}
                    className="bz-hover-dim"
                    style={{
                      position: "relative",
                      zIndex: 2,
                      flexShrink: 0,
                      height: 32,
                      padding: "0 12px",
                      background: t.urgent ? "var(--blue)" : "#fff",
                      color: t.urgent ? "#fff" : "var(--blue)",
                      border: t.urgent ? "1.5px solid var(--blue)" : "1.5px solid var(--blue)",
                      borderRadius: "var(--r-md)",
                      fontWeight: 600,
                      fontSize: ".75rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.action.label}
                  </button>
                ) : (
                  <SellerIcon name="chevronRight" size={18} color="var(--ink-400)" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Analytics grid: chart + payment donut */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
          className="bz-seller-grid bz-stack-900"
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--ink-900)",
                  }}
                >
                  {t("seller.dashboard.salesTrend")}
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontSize: ".75rem",
                  fontWeight: 600,
                  color: "var(--ink-500)",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{ width: 10, height: 10, borderRadius: 2, background: "var(--blue)" }}
                  />
                  {t("seller.dashboard.legendSales")}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{ width: 10, height: 10, borderRadius: 2, background: "var(--red)" }}
                  />
                  {t("seller.dashboard.legendToday")}
                </span>
              </div>
            </div>
            {salesByDay.length === 0 || salesByDay.every((d: { value?: number }) => !d.value) ? (
              <SellerEmptyState
                style={{ minHeight: 200, padding: "24px" }}
                icon="trendingUp"
                title={t("seller.dashboard.noSalesChartTitle")}
                message={t("seller.dashboard.noSalesChartMessage")}
              />
            ) : (
              <SellerBarChart
                data={salesByDay}
                height={200}
                summaryTotalLabel={
                  range === "today"
                    ? t("seller.dashboard.todayTotal")
                    : range === "month"
                      ? t("seller.dashboard.total30Day")
                      : t("seller.dashboard.total7Day")
                }
              />
            )}
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--ink-900)" }}>
                {t("seller.dashboard.bargaining")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                href={pathFromScreen("s-bargain")}
                iconRight="chevronRight"
              >
                {t("seller.dashboard.open")}
              </Button>
            </div>
            {bargainGlance && bargainGlance.pending > 0 && (
              <AppLink
                href={pathFromScreen("s-bargain")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--tint-red-50)",
                  border: "1.5px solid var(--red)",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  marginBottom: 12,
                  textAlign: "left",
                  textDecoration: "none",
                }}
              >
                <SellerIcon name="bargain" size={22} color="var(--red)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--red)", fontSize: ".875rem" }}>
                    {t("seller.dashboard.offersWaiting", { count: bargainGlance.pending })}
                  </div>
                </div>
                <SellerIcon name="chevronRight" size={18} color="var(--red)" />
              </AppLink>
            )}
            {bargainGlance && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div
                  style={{
                    padding: 10,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <div
                    className="tnum"
                    style={{ fontWeight: 600, fontSize: "1.125rem", color: "var(--success)" }}
                  >
                    {bargainGlance.accepted}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    {t("seller.dashboard.acceptedToday")}
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <div
                    className="tnum"
                    style={{ fontWeight: 600, fontSize: "1.125rem", color: "var(--saffron)" }}
                  >
                    {bargainGlance.avgGiven}%
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    {t("seller.dashboard.avgDiscount")}
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    gridColumn: "1 / -1",
                  }}
                >
                  <div
                    className="tnum"
                    style={{ fontWeight: 600, fontSize: "1rem", color: "var(--ink-900)" }}
                  >
                    {formatNPR(bargainGlance.marginGiven)}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    {t("seller.dashboard.marginGivenWeek")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages + Recent activity — side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: chatThreads.length > 0 ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
            gap: 18,
            marginBottom: 18,
          }}
          className="bz-seller-grid bz-stack-900"
        >
          {/* Recent messages — always visible, unread rows highlighted */}
          {chatThreads.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--line-200)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 600,
                    fontSize: ".9375rem",
                    color: "var(--ink-900)",
                  }}
                >
                  <SellerIcon name="message" size={18} color="var(--blue)" />
                  Messages
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {totalUnread > 0 && (
                    <Chip tone="red" size="sm">
                      {totalUnread}
                    </Chip>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    href={pathFromScreen("s-chat")}
                    iconRight="chevronRight"
                  >
                    Open
                  </Button>
                </div>
              </div>
              {chatThreads.slice(0, 3).map((ct, i) => {
                const hasUnread = (ct.unread ?? 0) > 0;
                return (
                  <AppLink
                    key={ct.id}
                    href={pathFromScreen("s-chat")}
                    onNavigate={() => nav("s-chat")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 16px",
                      borderBottom:
                        i < Math.min(chatThreads.length, 3) - 1
                          ? "1px solid var(--line-100)"
                          : "none",
                      background: hasUnread ? "var(--tint-blue-50)" : "transparent",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    <BuyerAvatar
                      src={ct.avatarUrl}
                      name={ct.buyer}
                      size={34}
                      fontSize=".8125rem"
                      style={{
                        background: TINTS[ct.tone as keyof typeof TINTS]?.[0] ?? TINTS.blue[0],
                        color: TINTS[ct.tone as keyof typeof TINTS]?.[2] ?? TINTS.blue[2],
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: hasUnread ? 700 : 500,
                            fontSize: ".8125rem",
                            color: "var(--ink-900)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ct.buyer}
                        </span>
                        <span
                          style={{ fontSize: ".65rem", color: "var(--ink-400)", flexShrink: 0 }}
                        >
                          {ct.time}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: ".75rem",
                          color: hasUnread ? "var(--ink-800)" : "var(--ink-500)",
                          fontWeight: hasUnread ? 600 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 1,
                        }}
                      >
                        {ct.last}
                      </div>
                    </div>
                    {hasUnread && (
                      <span
                        style={{
                          minWidth: 20,
                          height: 20,
                          padding: "0 5px",
                          borderRadius: 999,
                          background: "var(--danger)",
                          color: "#fff",
                          fontSize: ".65rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {ct.unread}
                      </span>
                    )}
                  </AppLink>
                );
              })}
            </div>
          )}

          {/* Recent activity */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--line-200)",
                fontWeight: 600,
                fontSize: ".9375rem",
                color: "var(--ink-900)",
              }}
            >
              {t("seller.dashboard.recentActivity")}
            </div>
            <div
              style={{
                padding: "0 16px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {activity.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: i < activity.length - 1 ? "1px dashed var(--line-200)" : "none",
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--line-100)",
                      color: a.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <SellerIcon name={a.icon} size={14} color={a.color} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-900)", lineHeight: 1.4 }}>
                      {a.text}
                    </div>
                    <div style={{ fontSize: ".65rem", color: "var(--ink-400)", marginTop: 2 }}>
                      {a.t}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products — a data table that reflows into stacked cards on phones
            via the shared bz-dtable pattern (label-on-top under 600px). */}
        <Card
          title={t("seller.dashboard.topProducts")}
          action={
            <Button
              variant="ghost"
              size="sm"
              href={pathFromScreen("s-products")}
              iconRight="chevronRight"
            >
              {t("seller.dashboard.seeAll")}
            </Button>
          }
        >
          <div
            className="bz-dtable"
            style={{ "--bz-dtable-cols": "1fr 110px 130px 120px" } as React.CSSProperties}
          >
            <div className="bz-dtable__head">
              <span>{t("seller.dashboard.colProduct")}</span>
              <span>{t("seller.dashboard.colUnitsSold")}</span>
              <span>{t("seller.dashboard.colRevenue")}</span>
              <span>{t("seller.dashboard.colTrend")}</span>
            </div>
            {topProducts.map((p) => (
              <div className="bz-dtable__row" key={p.name}>
                <div
                  className="bz-dtable__full"
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <Placeholder
                    icon={p.icon}
                    tint={p.tint}
                    style={{ width: 40, height: 40 }}
                    radius="var(--r-sm)"
                  />
                  <span style={{ fontWeight: 600, fontSize: ".875rem" }}>{p.name}</span>
                </div>
                <div>
                  <span className="bz-dtable__lab">{t("seller.dashboard.colUnitsSold")}</span>
                  <span className="tnum" style={{ fontWeight: 600 }}>
                    {p.units}
                  </span>
                </div>
                <div>
                  <span className="bz-dtable__lab">{t("seller.dashboard.colRevenue")}</span>
                  <span className="tnum" style={{ fontWeight: 600, color: "var(--success)" }}>
                    {formatNPR(Number(p.rev))}
                  </span>
                </div>
                <div>
                  <span className="bz-dtable__lab">{t("seller.dashboard.colTrend")}</span>
                  <SellerSparkline data={p.spark ?? []} color="var(--blue)" height={24} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick actions strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            { icon: "plus", label: t("seller.common.addProduct"), tint: "green", to: "s-add" },
            {
              icon: "package",
              label: t("seller.navOrders"),
              tint: "red",
              to: "s-inbox",
              badge: pendingOrders > 0 ? String(pendingOrders) : undefined,
            },
            {
              icon: "store",
              label: t("seller.navProducts"),
              tint: "blue",
              to: "s-products",
            },
            { icon: "wallet", label: t("seller.navMoney"), tint: "saffron", to: "s-ledger" },
          ].map((a) => (
            <AppLink
              key={a.to}
              href={pathFromScreen(a.to)}
              style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                position: "relative",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--r-md)",
                  background: TINTS[a.tint as keyof typeof TINTS][0],
                  color: TINTS[a.tint as keyof typeof TINTS][2],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SellerIcon
                  name={a.icon}
                  size={22}
                  color={TINTS[a.tint as keyof typeof TINTS][2]}
                />
              </span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: ".9375rem" }}>{a.label}</div>
              </div>
              {a.badge && (
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "var(--danger)",
                    color: "#fff",
                    fontSize: ".75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {a.badge}
                </span>
              )}
            </AppLink>
          ))}
        </div>

        {/* Store health — trust signals as calm metric tiles (shared MetricGrid).
            Only shown once we have trust data, so there's no empty bordered box. */}
        {trustStrip.length > 0 && (
          <Card title={t("seller.dashboard.storeHealth")}>
            <MetricGrid>
              {trustStrip.map((s) => (
                <Metric key={s.k} label={s.k} value={s.v} />
              ))}
            </MetricGrid>
          </Card>
        )}
      </SellerPage>
    </ApiState>
  );
}
