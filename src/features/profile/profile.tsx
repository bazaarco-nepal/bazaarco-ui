// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useEffect, useRef, useState } from "react";
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
  AppLink,
  TINTS,
  AllInPriceCard,
  OTPInput,
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
  PasswordInput,
} from "@/components/ui";
import { useCatalog, useCreateProductReview } from "@/hooks/use-catalog";
import { ApiRequestError } from "@/services/api/http";
import {
  useDeleteAccount,
  useLogout,
  useRequestAccountDeletionOtp,
  useUpdateProfile,
} from "@/hooks/use-auth";
import { useUploadImage } from "@/hooks/use-media-upload";
import { useBargains } from "@/hooks/use-bargains";
import { useAddresses } from "@/hooks/use-addresses";
import { useCartQuery } from "@/hooks/use-cart";
import { useWishlistQuery } from "@/hooks/use-wishlist";
import { useCancelOrder, useOrders } from "@/hooks/use-orders";
import { canCancelOrder } from "@/lib/order-utils";
import { formatNPR } from "@/lib/money";
import { ConfirmModal } from "@/features/checkout/checkout";
import { useChatInbox } from "@/hooks/use-chat";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName } from "@/lib/display";
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
  BuyerAvatar,
  ChangePasswordModal,
  LogoutConfirmModal,
  LanguageToggle,
} from "@/components/common";
import { pathFromScreen } from "@/config/routes";
import type { WriteReviewProps } from "@/types";

/* ============================================================
   BazaarCo — Profile, Orders list, Write review
   Guide §3.10, §3.13, §3.14
   ============================================================ */

const ORDER_STATUS_META = {
  placed: {
    tone: "blue",
    label: "Order placed",
    action: "Track",
    actionVariant: "secondary",
  },
  applied: {
    tone: "blue",
    label: "Awaiting confirmation",
    action: "Track",
    actionVariant: "secondary",
  },
  accepted: { tone: "blue", label: "Accepted", action: "Track", actionVariant: "secondary" },
  confirmed: { tone: "blue", label: "Confirmed", action: "Track", actionVariant: "secondary" },
  packaging_started: {
    tone: "saffron",
    label: "Packaging",
    action: "Track",
    actionVariant: "secondary",
  },
  packed: { tone: "saffron", label: "Packed", action: "Track", actionVariant: "secondary" },
  ready_for_pickup: {
    tone: "saffron",
    label: "Ready for pickup",
    action: "Track",
    actionVariant: "secondary",
  },
  picked_up: { tone: "blue", label: "Picked up", action: "Track", actionVariant: "secondary" },
  arrived_at_hub: {
    tone: "blue",
    label: "At hub",
    action: "Track",
    actionVariant: "secondary",
  },
  out_for_delivery: {
    tone: "saffron",
    label: "Out for delivery",
    action: "Call rider",
    actionVariant: "primary",
  },
  shipped: {
    tone: "saffron",
    label: "On the way",
    action: "Call rider",
    actionVariant: "primary",
  },
  delivered: {
    tone: "success",
    label: "Delivered",
    action: "Rate & review",
    actionVariant: "primary",
  },
  cancelled: { tone: "neutral", label: "Cancelled", action: "Order again", actionVariant: "ghost" },
};

const DEFAULT_ORDER_STATUS_META = {
  tone: "neutral",
  label: "Processing",
  action: "Track",
  actionVariant: "secondary",
};

function orderStatusMeta(status: string) {
  return ORDER_STATUS_META[status] ?? DEFAULT_ORDER_STATUS_META;
}

// The product a delivered order's "Rate & review" targets. Set before
// nav("review") and read by MarketplaceScreen to render the right product —
// same module-ref handoff as `editProductRef` in seller.tsx.
export const reviewProductRef = { current: null as string | null };

export function Orders() {
  const { t } = useTranslation();
  const { nav, openTracking } = useBz();
  const { data: ordersData = [], isLoading, isError, error } = useOrders();
  const cancelOrder = useCancelOrder();
  const { byId } = useCatalog();
  const [filter, setFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const orders = ordersData.filter((o) => {
    if (filter === "active")
      return [
        "placed",
        "accepted",
        "packaging_started",
        "ready_for_pickup",
        "picked_up",
        "arrived_at_hub",
        "out_for_delivery",
      ].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "28px 28px 96px" }}
      >
        <h1
          style={{
            margin: "0 0 24px",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          {t("profile.myOrders")}
        </h1>

        <div style={{ marginBottom: 24 }}>
          <ChipGroup
            options={[
              { value: "all", label: t("profile.filterAll") },
              { value: "active", label: t("profile.filterActive") },
              { value: "delivered", label: t("profile.filterDelivered") },
              { value: "cancelled", label: t("profile.filterCancelled") },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={t("orders.noOrders")}
            message={t("profile.noOrdersMessage")}
            cta={t("profile.startShopping")}
            ctaHref={pathFromScreen("home")}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {orders.map((o) => {
              const meta = orderStatusMeta(o.status);
              const items = o.items.map(byId).filter(Boolean);
              return (
                <div
                  key={o.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-lg)",
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                      >
                        <span className="tnum" style={{ fontWeight: 800, color: "var(--ink-900)" }}>
                          #{o.id}
                        </span>
                        <Chip tone={meta.tone}>{meta.label}</Chip>
                      </div>
                      <div style={{ fontSize: ".8125rem", color: "var(--ink-400)", marginTop: 4 }}>
                        Placed {o.placed}
                      </div>
                    </div>
                    <span
                      className="tnum"
                      style={{ fontWeight: 800, color: "var(--blue-deep)", fontSize: "1.125rem" }}
                    >
                      {formatNPR(o.total)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0" }}>
                    <div style={{ display: "flex" }}>
                      {items.slice(0, 3).map((it, i) => (
                        <span
                          key={it.id}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            border: "2px solid #fff",
                            marginLeft: i === 0 ? 0 : -12,
                            overflow: "hidden",
                            boxShadow: "var(--sh-1)",
                          }}
                        >
                          {it.img ? (
                            <img
                              src={it.img}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Placeholder
                              icon={it.icon}
                              tint={it.tint}
                              style={{ width: 44, height: 44 }}
                              radius="50%"
                            />
                          )}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>
                      {items.length === 1 ? items[0].name : `${items.length} items`}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {o.status === "cancelled" ? (
                      <Button variant="ghost" onClick={() => nav("home")}>
                        Order again
                      </Button>
                    ) : (
                      <Button
                        variant={meta.actionVariant}
                        onClick={() => {
                          if (
                            o.status === "placed" ||
                            o.status === "accepted" ||
                            o.status === "packaging_started" ||
                            o.status === "ready_for_pickup" ||
                            o.status === "picked_up" ||
                            o.status === "arrived_at_hub" ||
                            o.status === "out_for_delivery"
                          )
                            openTracking(o.id);
                          else if (o.status === "delivered") {
                            reviewProductRef.current = o.items[0] ?? null;
                            nav("review");
                          }
                        }}
                        icon={o.status === "out_for_delivery" ? "phone" : undefined}
                      >
                        {meta.action}
                      </Button>
                    )}
                    {canCancelOrder(o) && (
                      <Button
                        variant="secondary"
                        disabled={cancelOrder.isPending}
                        onClick={() => setCancelTarget(o)}
                      >
                        Cancel order
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      href={pathFromScreen("tracking", undefined, undefined, o.id)}
                      onNavigate={() => openTracking(o.id)}
                    >
                      View details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {cancelTarget && (
        <ConfirmModal
          title="Cancel order?"
          message={`Cancel order #${cancelTarget.id}? You can only cancel before BazaarCo pickup collects it from the seller.`}
          confirmLabel={cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
          onConfirm={async () => {
            try {
              await cancelOrder.mutateAsync(cancelTarget.id);
              setCancelTarget(null);
            } catch {
              /* ApiState / global handlers surface errors */
            }
          }}
          onCancel={() => !cancelOrder.isPending && setCancelTarget(null)}
        />
      )}
    </ApiState>
  );
}

// Orders that still need attention — anything that isn't a closed end-state.
// Mirrors the API's order state machine (orders.constants.ts).
const ACTIVE_ORDER_STATUSES = [
  "placed",
  "applied",
  "accepted",
  "confirmed",
  "packaging_started",
  "packed",
  "ready_for_pickup",
  "picked_up",
  "arrived_at_hub",
  "out_for_delivery",
  "shipped",
];

function isActiveOrder(status: string) {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

// A live stat in the account header band. Tappable shortcut to the relevant
// section; `value` shows an em-dash placeholder while the query is in flight.
function StatTile({ value, label, href, onNavigate }) {
  return (
    <AppLink href={href} onNavigate={onNavigate} className="bz-stat">
      <span className="bz-stat__value tnum">{value}</span>
      <span className="bz-stat__label">{label}</span>
    </AppLink>
  );
}

// One account hub entry: a square icon tile, title (+ optional badge), and a
// live subtitle. Renders as a link (with SPA onNavigate) or a button.
function AcctRow({ icon, title, sub, badge, accent, href, onNavigate, onClick }) {
  const Tag = href ? AppLink : "button";
  const tagProps = href ? { href, onNavigate } : { onClick, type: "button" };
  return (
    <Tag {...tagProps} className={`bz-acct-row${accent ? " bz-acct-row--accent" : ""}`}>
      <span className={`bz-acct-row__icon${accent ? " bz-acct-row__icon--accent" : ""}`}>
        <Icon name={icon} size={20} color={accent ? "var(--blue)" : "var(--ink-700)"} />
      </span>
      <span className="bz-acct-row__body">
        <span className="bz-acct-row__title">
          {title}
          {badge && <span className="bz-acct-row__badge">{badge}</span>}
        </span>
        {sub && <span className="bz-acct-row__sub">{sub}</span>}
      </span>
      <Icon name="chevronRight" size={18} color="var(--ink-300)" />
    </Tag>
  );
}

export function Profile() {
  const { t } = useTranslation();
  const { nav, toast } = useBz();
  const logoutMutation = useLogout();
  const deleteMutation = useDeleteAccount();
  const user = useBazaarStore((s) => s.user);
  const authed = useBazaarStore((s) => s.authed);
  const ordersQuery = useOrders();
  const cartQuery = useCartQuery(authed);
  const wishlistQuery = useWishlistQuery(authed);
  const bargainsQuery = useBargains();
  const { data: savedAddresses = [] } = useAddresses();
  const { data: chatInbox } = useChatInbox();

  // Live counts — every number here is real backend data, no placeholders.
  const orders = ordersQuery.data ?? [];
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => isActiveOrder(o.status)).length;
  const cartCount = cartQuery.data?.items.length ?? 0;
  const wishlistCount = wishlistQuery.data?.productIds.length ?? 0;
  const bargains = bargainsQuery.data ?? [];
  // "Active" bargains = anything the seller hasn't rejected (pending/countered/accepted).
  const activeBargains = bargains.filter((b) => b.status !== "rejected").length;
  const unreadMessages = (chatInbox?.threads ?? []).reduce((sum, t) => sum + (t.unread || 0), 0);

  const firstName = displayName(user, "there").split(/\s+/)[0];
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;
  const dash = "–";
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const otpMutation = useRequestAccountDeletionOtp();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"request" | "confirm">("request");
  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteMaskedEmail, setDeleteMaskedEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const requiresPassword = user?.provider === "local";
  const canRequestOtp = deleteText.trim().toUpperCase() === "DELETE" && !otpMutation.isPending;
  const canDelete =
    deleteOtp.length === 6 &&
    (!requiresPassword || deletePassword.length > 0) &&
    !deleteMutation.isPending;

  const closeDeleteModal = () => {
    setConfirmDelete(false);
    setDeleteStep("request");
    setDeleteText("");
    setDeletePassword("");
    setDeleteOtp("");
    setDeleteMaskedEmail("");
    setDeleteError(null);
    setResendCooldown(0);
  };

  // Escape-to-close + body scroll-lock while the delete modal is open.
  useEffect(() => {
    if (!confirmDelete) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !deleteMutation.isPending && !otpMutation.isPending)
        closeDeleteModal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmDelete, deleteMutation.isPending, otpMutation.isPending]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast?.("Logged out");
        nav("home");
        setConfirmLogout(false);
      },
    });
  };

  const handleRequestDeleteOtp = () => {
    if (!canRequestOtp) return;
    setDeleteError(null);
    otpMutation.mutate(undefined, {
      onSuccess: (data) => {
        setDeleteMaskedEmail(data.email);
        setDeleteStep("confirm");
        setResendCooldown(30);
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not send verification code");
      },
    });
  };

  const handleResendDeleteOtp = () => {
    if (resendCooldown > 0 || otpMutation.isPending) return;
    setDeleteError(null);
    otpMutation.mutate(undefined, {
      onSuccess: (data) => {
        setDeleteMaskedEmail(data.email);
        setResendCooldown(30);
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not resend code");
      },
    });
  };

  const handleDelete = () => {
    if (!canDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(
      { otp: deleteOtp, ...(requiresPassword ? { password: deletePassword } : {}) },
      {
        onSuccess: () => {
          closeDeleteModal();
          toast?.("Account deleted. We're sorry to see you go.");
          nav("home");
        },
        onError: (err) => {
          setDeleteError(err instanceof Error ? err.message : "Could not delete account");
        },
      },
    );
  };

  return (
    <div className="bz-profile">
      <style>{`
        .bz-profile {
          max-width: var(--container);
          margin: 0 auto;
          padding: 28px 28px 96px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        @media (max-width: 899px) {
          .bz-profile { padding: 20px 16px 96px; gap: 22px; }
        }

        /* ---- Account header band: identity + live stats, full width ---- */
        .bz-acct-header {
          background: #fff;
          border: 1px solid var(--line-200);
          border-radius: var(--r-xl);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          box-shadow: var(--sh-1);
        }
        .bz-acct-header__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .bz-acct-header__identity {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }
        .bz-acct-header__avatar { flex-shrink: 0; display: inline-flex; }
        .bz-acct-header__name {
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--ink-900);
          line-height: 1.2;
        }
        .bz-acct-header__meta {
          font-size: .875rem;
          color: var(--ink-500);
          margin-top: 3px;
          overflow-wrap: anywhere;
        }
        .bz-greet--mobile { display: none; }
        .bz-edit--short { display: none; }

        /* ---- Stat tiles ---- */
        .bz-acct-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .bz-stat {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 14px 16px;
          border: 1px solid var(--line-200);
          border-radius: var(--r-lg);
          background: var(--page);
          text-decoration: none;
          transition: border-color var(--dur-standard) var(--ease), background var(--dur-standard) var(--ease);
        }
        .bz-stat:hover { border-color: var(--blue); background: #fff; }
        .bz-stat__value { font-size: 1.5rem; font-weight: 800; color: var(--ink-900); line-height: 1.1; }
        .bz-stat__label { font-size: .8125rem; font-weight: 600; color: var(--ink-400); }

        /* ---- Section groups ---- */
        .bz-acct-group { display: flex; flex-direction: column; gap: 12px; }
        .bz-acct-group__title {
          margin: 0;
          padding-left: 2px;
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: var(--ink-400);
        }
        /* Three cards per row on desktop; auto-fit stretches a 2-card group
           (Settings & help) to fill the width. Collapses to a list on mobile. */
        .bz-acct-group__cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        /* ---- Hub row / card ---- */
        .bz-acct-row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 16px;
          background: #fff;
          border: 1px solid var(--line-200);
          border-radius: var(--r-lg);
          text-align: left;
          text-decoration: none;
          font-family: inherit;
          cursor: pointer;
          transition: border-color var(--dur-standard) var(--ease), box-shadow var(--dur-standard) var(--ease);
        }
        .bz-acct-row:hover { border-color: var(--blue); box-shadow: var(--sh-1); }
        .bz-acct-row--static { cursor: default; }
        .bz-acct-row--static:hover { border-color: var(--line-200); box-shadow: none; }
        .bz-acct-row--accent { border-color: var(--blue); box-shadow: inset 0 0 0 1px var(--blue); }
        .bz-acct-row__icon {
          width: 44px;
          height: 44px;
          border-radius: var(--r-md);
          background: var(--line-100);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bz-acct-row__icon--accent { background: var(--tint-blue-50); }
        .bz-acct-row__body { flex: 1; min-width: 0; }
        .bz-acct-row__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: .9375rem;
          color: var(--ink-900);
        }
        .bz-acct-row__sub {
          display: block;
          margin-top: 2px;
          font-size: .8125rem;
          color: var(--ink-400);
        }
        .bz-acct-row__badge {
          flex-shrink: 0;
          font-size: .6875rem;
          font-weight: 700;
          color: var(--blue);
          background: var(--tint-blue-50);
          padding: 2px 8px;
          border-radius: var(--r-full);
        }

        .bz-delete-link {
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          padding: 4px 2px;
          margin-top: 14px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          font-size: .75rem;
          color: var(--ink-400);
          opacity: .55;
          transition: opacity .15s, color .15s;
        }
        .bz-delete-link:hover { opacity: .85; color: var(--danger); }

        /* ---- Mobile: greeting instead of avatar, grouped list cards ---- */
        .bz-profile__logout-mobile { display: none; }
        @media (max-width: 899px) {
          .bz-acct-header { padding: 18px; gap: 18px; }
          .bz-acct-header__avatar { display: none; }
          .bz-greet--desktop { display: none; }
          .bz-greet--mobile { display: block; }
          .bz-acct-header__member { display: none; }
          .bz-edit--full { display: none; }
          .bz-edit--short { display: inline; }
          .bz-acct-stats { gap: 8px; }
          .bz-stat { padding: 12px 8px; align-items: center; text-align: center; }
          .bz-stat__value { font-size: 1.25rem; }
          .bz-stat__label { font-size: .6875rem; }

          .bz-acct-group__cards {
            grid-template-columns: 1fr;
            gap: 0;
            background: #fff;
            border: 1px solid var(--line-200);
            border-radius: var(--r-xl);
            overflow: hidden;
          }
          .bz-acct-group__cards .bz-acct-row {
            position: relative;
            border: none;
            border-radius: 0;
            box-shadow: none;
          }
          .bz-acct-group__cards .bz-acct-row--accent { box-shadow: none; }
          .bz-acct-group__cards .bz-acct-row:not(:first-child)::before {
            content: "";
            position: absolute;
            top: 0;
            left: 74px;
            right: 0;
            height: 1px;
            background: var(--line-100);
          }
          .bz-profile__logout-mobile { display: block; margin-top: 4px; }
        }
      `}</style>

      {/* ACCOUNT HEADER BAND — identity + live stats (desktop avatar, mobile greeting) */}
      <header className="bz-acct-header">
        <div className="bz-acct-header__top">
          <div className="bz-acct-header__identity">
            <span className="bz-acct-header__avatar">
              <BuyerAvatar user={user} size={56} fontSize="1.375rem" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="bz-acct-header__name bz-greet--desktop">
                {displayName(user, "Guest")}
              </div>
              <div className="bz-acct-header__name bz-greet--mobile">
                {t("profile.hi", { name: firstName })}
              </div>
              <div className="bz-acct-header__meta tnum">
                {user?.email ?? ""}
                {memberSince && (
                  <span className="bz-acct-header__member">
                    {" "}
                    · {t("profile.memberSince", { year: memberSince })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            href={pathFromScreen("profile-edit")}
            onNavigate={() => nav("profile-edit")}
          >
            <span className="bz-edit--full">{t("profile.editProfile")}</span>
            <span className="bz-edit--short">{t("profile.edit")}</span>
          </Button>
        </div>

        <div className="bz-acct-stats">
          <StatTile
            value={ordersQuery.isLoading ? dash : totalOrders}
            label={t("profile.ordersLabel")}
            href={pathFromScreen("orders")}
            onNavigate={() => nav("orders")}
          />
          <StatTile
            value={cartQuery.isLoading ? dash : cartCount}
            label={t("profile.inCart")}
            href={pathFromScreen("cart")}
            onNavigate={() => nav("cart")}
          />
          <StatTile
            value={wishlistQuery.isLoading ? dash : wishlistCount}
            label={t("profile.wishlist")}
            href={pathFromScreen("wishlist")}
            onNavigate={() => nav("wishlist")}
          />
          <StatTile
            value={bargainsQuery.isLoading ? dash : activeBargains}
            label={t("profile.bargainsLabel")}
            href={pathFromScreen("bargains")}
            onNavigate={() => nav("bargains")}
          />
        </div>
      </header>

      {/* SHOPPING — My orders carries the accent + live active count */}
      <section className="bz-acct-group">
        <h2 className="bz-acct-group__title">{t("profile.shopping")}</h2>
        <div className="bz-acct-group__cards">
          <AcctRow
            accent
            icon="package"
            title={t("profile.myOrders")}
            badge={
              activeOrders > 0 ? t("profile.activeOrdersBadge", { count: activeOrders }) : undefined
            }
            sub={t("profile.trackReturn")}
            href={pathFromScreen("orders")}
            onNavigate={() => nav("orders")}
          />
          <AcctRow
            icon="cart"
            title={t("profile.myCart")}
            sub={
              cartCount
                ? cartCount === 1
                  ? t("profile.itemReadyCheckout", { count: cartCount })
                  : t("profile.itemsReadyCheckout", { count: cartCount })
                : t("cart.empty")
            }
            href={pathFromScreen("cart")}
            onNavigate={() => nav("cart")}
          />
          <AcctRow
            icon="heart"
            title={t("profile.wishlist")}
            sub={
              wishlistCount
                ? wishlistCount === 1
                  ? t("profile.savedProduct", { count: wishlistCount })
                  : t("profile.savedProducts", { count: wishlistCount })
                : t("profile.noSavedProducts")
            }
            href={pathFromScreen("wishlist")}
            onNavigate={() => nav("wishlist")}
          />
          <AcctRow
            icon="store"
            title={t("profile.allStores")}
            sub={t("profile.allStoresSub")}
            href={pathFromScreen("stores")}
            onNavigate={() => nav("stores")}
          />
        </div>
      </section>

      {/* ACTIVITY */}
      <section className="bz-acct-group">
        <h2 className="bz-acct-group__title">{t("profile.activity")}</h2>
        <div className="bz-acct-group__cards">
          <AcctRow
            icon="messageDots"
            title={t("profile.myMessages")}
            badge={unreadMessages > 0 ? String(unreadMessages) : undefined}
            sub={
              unreadMessages
                ? unreadMessages === 1
                  ? t("profile.unreadMessage", { count: unreadMessages })
                  : t("profile.unreadMessages", { count: unreadMessages })
                : t("profile.chatsWithSellers")
            }
            href={pathFromScreen("messages")}
            onNavigate={() => nav("messages")}
          />
          <AcctRow
            icon="bargain"
            title={t("profile.myBargains")}
            badge={activeBargains > 0 ? String(activeBargains) : undefined}
            sub={
              activeBargains
                ? activeBargains === 1
                  ? t("profile.activeOffer", { count: activeBargains })
                  : t("profile.activeOffers", { count: activeBargains })
                : t("profile.noActiveOffers")
            }
            href={pathFromScreen("bargains")}
            onNavigate={() => nav("bargains")}
          />
          <AcctRow
            icon="mapPin"
            title={t("profile.savedAddresses")}
            sub={
              savedAddresses.length
                ? t("profile.addressesSaved", {
                    count: savedAddresses.length,
                    default:
                      savedAddresses.find((a) => a.isDefault)?.label ??
                      savedAddresses[0]?.label ??
                      "Home",
                  })
                : t("profile.addressesHint")
            }
            href={pathFromScreen("addresses")}
            onNavigate={() => nav("addresses")}
          />
        </div>
      </section>

      {/* SETTINGS & HELP */}
      <section className="bz-acct-group">
        <h2 className="bz-acct-group__title">{t("profile.settingsHelp")}</h2>
        <div className="bz-acct-group__cards">
          <div className="bz-acct-row bz-acct-row--static">
            <span className="bz-acct-row__icon">
              <Icon name="globe" size={20} color="var(--ink-700)" />
            </span>
            <span className="bz-acct-row__body">
              <span className="bz-acct-row__title">{t("profile.language")}</span>
              <span className="bz-acct-row__sub">{t("profile.languageSub")}</span>
            </span>
            <LanguageToggle compact />
          </div>
          {requiresPassword && (
            <AcctRow
              icon="lock"
              title={t("profile.changePassword")}
              sub={t("profile.changePasswordSub")}
              onClick={() => setChangePwdOpen(true)}
            />
          )}
          <AcctRow
            icon="headphones"
            title={t("profile.helpSupport")}
            sub={t("profile.helpSupportSub")}
            href={pathFromScreen("help")}
            onNavigate={() => nav("help")}
          />
        </div>
      </section>

      {/* LEGAL — always visible; no longer nested under an Account toggle */}
      <section className="bz-acct-group">
        <h2 className="bz-acct-group__title">{t("profile.legal")}</h2>
        <div className="bz-acct-group__cards">
          <AcctRow
            icon="shieldCheck"
            title={t("profile.privacyPolicy")}
            sub={t("profile.privacySub")}
            href={pathFromScreen("privacy")}
            onNavigate={() => nav("privacy")}
          />
          <AcctRow
            icon="file"
            title={t("profile.termsConditions")}
            sub={t("profile.termsSub")}
            href={pathFromScreen("terms")}
            onNavigate={() => nav("terms")}
          />
        </div>
      </section>

      {/* Delete account — destructive, sits just above logout */}
      <section className="bz-acct-group">
        <button className="bz-delete-link" onClick={() => setConfirmDelete(true)}>
          {t("profile.deleteAccount")}
        </button>
      </section>

      {/* Mobile only: a dedicated logout at the very end of the profile. On
          desktop, logout lives in the navbar account menu instead. Both routes
          open the same confirmation modal before signing out. */}
      <div className="bz-profile__logout-mobile">
        <Button variant="danger" full icon="logout" onClick={() => setConfirmLogout(true)}>
          {t("profile.logOut")}
        </Button>
      </div>

      {/* Change password modal */}
      <ChangePasswordModal open={changePwdOpen} onClose={() => setChangePwdOpen(false)} />

      {/* Logout confirmation modal */}
      <LogoutConfirmModal
        open={confirmLogout}
        pending={logoutMutation.isPending}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />

      {/* Account deletion confirmation modal — two-step: request OTP then confirm */}
      {confirmDelete && (
        <div
          onClick={() => {
            if (!deleteMutation.isPending && !otpMutation.isPending) closeDeleteModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 700,
            background: "rgba(11,18,32,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <style>{`
            .bz-delete-actions { display: flex; gap: 10px; flex-direction: row; }
            @media (max-width: 480px) { .bz-delete-actions { flex-direction: column; } }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bz-modal"
            style={{
              background: "#fff",
              borderRadius: "var(--r-xl)",
              padding: 28,
              width: "100%",
              maxWidth: 460,
              boxShadow: "var(--sh-3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--tint-red-50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--danger)",
                  fontWeight: 800,
                  fontSize: 24,
                }}
              >
                !
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  color: "var(--ink-900)",
                }}
              >
                Delete your account?
              </h3>
            </div>
            <p
              style={{
                margin: "0 0 14px",
                color: "var(--ink-500)",
                fontSize: ".9375rem",
                lineHeight: 1.5,
              }}
            >
              This action is <b style={{ color: "var(--danger)" }}>permanent</b> and cannot be
              undone. You will lose:
            </p>
            <ul
              style={{
                margin: "0 0 18px 20px",
                padding: 0,
                color: "var(--ink-700)",
                fontSize: ".875rem",
                lineHeight: 1.7,
              }}
            >
              <li>Order history and tracking</li>
              <li>Saved addresses and wishlist</li>
              <li>Reviews and ratings you've posted</li>
            </ul>

            {deleteStep === "request" && (
              <>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: ".8125rem",
                    fontWeight: 700,
                    color: "var(--ink-700)",
                  }}
                >
                  Type <b style={{ color: "var(--danger)" }}>DELETE</b> below to confirm
                </p>
                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="Type DELETE"
                  autoFocus
                  style={{
                    width: "100%",
                    height: 44,
                    border: "1.5px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: "0 14px",
                    fontSize: ".9375rem",
                    fontFamily: "var(--font-sans)",
                    outline: "none",
                    marginBottom: 18,
                    letterSpacing: ".02em",
                  }}
                />
              </>
            )}

            {deleteStep === "confirm" && (
              <>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: ".875rem",
                    color: "var(--ink-600)",
                  }}
                >
                  We sent a 6-digit code to <b>{deleteMaskedEmail}</b>
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: ".8125rem",
                    fontWeight: 700,
                    color: "var(--ink-700)",
                  }}
                >
                  Verification code
                </p>
                <input
                  value={deleteOtp}
                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  style={{
                    width: "100%",
                    height: 44,
                    border: "1.5px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: "0 14px",
                    fontSize: "1.125rem",
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "6px",
                    outline: "none",
                    marginBottom: requiresPassword ? 12 : 4,
                  }}
                />
                {requiresPassword && (
                  <>
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: ".8125rem",
                        fontWeight: 700,
                        color: "var(--ink-700)",
                      }}
                    >
                      Confirm your password
                    </p>
                    <PasswordInput
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      inputStyle={{
                        width: "100%",
                        height: 44,
                        border: "1.5px solid var(--line-200)",
                        borderRadius: "var(--r-md)",
                        padding: "0 14px",
                        fontSize: ".9375rem",
                        fontFamily: "var(--font-sans)",
                        outline: "none",
                        marginBottom: 4,
                      }}
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={handleResendDeleteOtp}
                  disabled={resendCooldown > 0 || otpMutation.isPending}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                    marginBottom: 14,
                    color: resendCooldown > 0 ? "var(--ink-400)" : "var(--primary)",
                    fontSize: ".8125rem",
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                  }}
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                </button>
              </>
            )}

            {deleteError && (
              <p
                style={{
                  margin: "0 0 14px",
                  color: "var(--danger)",
                  fontSize: ".875rem",
                  fontWeight: 600,
                }}
              >
                {deleteError}
              </p>
            )}
            <div className="bz-delete-actions">
              <Button
                variant="primary"
                full
                disabled={deleteMutation.isPending || otpMutation.isPending}
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
              {deleteStep === "request" ? (
                <Button
                  variant="danger"
                  full
                  disabled={!canRequestOtp}
                  loading={otpMutation.isPending}
                  onClick={handleRequestDeleteOtp}
                >
                  Proceed
                </Button>
              ) : (
                <Button
                  variant="danger"
                  full
                  disabled={!canDelete}
                  loading={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  Delete forever
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WriteReview({ productId }: WriteReviewProps) {
  const { nav, toast } = useBz();
  const { byId } = useCatalog();
  const p = productId ? byId(productId) : undefined;
  const createReview = useCreateProductReview(productId ?? null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState(0);

  // No reviewed product resolved (cold load / deep link with no stashed id):
  // there's nothing to rate, so point the user back to their orders.
  if (!p) {
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 80px" }}
      >
        <EmptyState
          title="Pick an order to review"
          message="Open a delivered order and tap “Rate & review” to leave a review."
          cta="Back to orders"
          ctaHref={pathFromScreen("orders")}
        />
      </div>
    );
  }

  const submit = async () => {
    if (rating === 0 || createReview.isPending) return;
    try {
      await createReview.mutateAsync({ rating, text: text.trim() });
      toast("Thanks! Review posted.");
      nav("orders");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        toast("You can only review products you've purchased.");
      } else if (err instanceof ApiRequestError && err.status === 409) {
        toast("You've already reviewed this product.");
      } else {
        toast("Could not post review. Try again.");
      }
    }
  };

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "24px 28px 80px" }}
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
          marginBottom: 14,
          fontSize: ".875rem",
          textDecoration: "none",
        }}
      >
        <Icon name="chevronLeft" size={16} /> Back
      </AppLink>

      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        Rate your purchase
      </h1>
      <p style={{ color: "var(--ink-500)", margin: "6px 0 22px" }}>
        Your honest review helps other shoppers in Nepal.
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          padding: 18,
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        {p.img ? (
          <img
            src={p.img}
            alt={p.name}
            style={{ width: 60, height: 60, borderRadius: "var(--r-md)", objectFit: "cover" }}
          />
        ) : (
          <Placeholder
            icon={p.icon}
            tint={p.tint}
            style={{ width: 60, height: 60 }}
            radius="var(--r-md)"
          />
        )}
        <div>
          <div style={{ fontWeight: 700 }}>{p.name}</div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 3 }}>Delivered</div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          padding: 22,
          textAlign: "center",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: ".875rem",
            fontWeight: 700,
            color: "var(--ink-700)",
            marginBottom: 14,
          }}
        >
          Tap the stars
        </div>
        <div style={{ display: "inline-flex", gap: 10 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}
            >
              <Icon
                name="star"
                size={44}
                color={s <= rating ? "var(--gold)" : "var(--line-200)"}
                fill={s <= rating ? "var(--gold)" : "var(--line-200)"}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <div style={{ marginTop: 12, fontSize: ".875rem", color: "var(--ink-500)" }}>
            {["", "Bad", "Not great", "Okay", "Good", "Excellent"][rating]}
          </div>
        )}
      </div>

      <button
        onClick={() => setPhotos((p) => Math.min(p + 1, 5))}
        style={{
          width: "100%",
          padding: 18,
          background: "rgba(247,127,0,.08)",
          border: "1.5px dashed var(--saffron)",
          borderRadius: "var(--r-lg)",
          color: "var(--saffron)",
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <Icon name="image" size={22} color="var(--saffron)" />
        {photos === 0
          ? "Add photos"
          : `${photos} photo${photos > 1 ? "s" : ""} added · tap to add more`}
      </button>
      {photos > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {Array.from({ length: photos }).map((_, i) => (
            <Placeholder
              key={i}
              icon={p.icon}
              tint={p.tint}
              style={{ width: 60, height: 60 }}
              radius="var(--r-sm)"
            />
          ))}
        </div>
      )}
      <p
        style={{
          fontSize: ".8125rem",
          color: "var(--ink-400)",
          margin: "0 0 16px",
          textAlign: "center",
        }}
      >
        Real photos help other shoppers more than words.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell others about it… (optional)"
        rows={4}
        style={{
          width: "100%",
          border: "1.5px solid var(--line-200)",
          borderRadius: "var(--r-md)",
          padding: 14,
          fontSize: ".9375rem",
          fontFamily: "var(--font-sans)",
          outline: "none",
          resize: "vertical",
        }}
      />

      <div style={{ marginTop: 20 }}>
        <Button
          variant="primary"
          size="lg"
          full
          disabled={rating === 0}
          loading={createReview.isPending}
          onClick={() => void submit()}
        >
          Post review
        </Button>
      </div>
    </div>
  );
}

function profileFormFromUser(user: { name?: string | null; email?: string | null } | null) {
  const parts = (user?.name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    phone: "",
    email: user?.email ?? "",
    gender: "",
    dob: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
    area: "",
    landmark: "",
    inAppConsent: true,
    emailConsent: false,
  };
}

export function ProfileEdit() {
  const { nav, toast } = useBz();
  const user = useBazaarStore((s) => s.user);
  const buyerPhone = useBazaarStore((s) => s.buyerPhone);
  const setBuyerPhone = useBazaarStore((s) => s.setBuyerPhone);
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadImage();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => ({ ...profileFormFromUser(user), phone: buyerPhone }));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [uploadProgress, setUploadProgress] = useState(0);
  useEffect(() => {
    // Preserve the shared phone across user refreshes.
    setForm({ ...profileFormFromUser(user), phone: useBazaarStore.getState().buyerPhone });
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user]);
  useEffect(() => {
    setForm((f) => ({ ...f, phone: buyerPhone }));
  }, [buyerPhone]);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const currentName = () => `${form.firstName} ${form.lastName}`.trim() || user?.name || "Buyer";
  const save = async () => {
    setBuyerPhone(form.phone);
    try {
      await updateProfile.mutateAsync({ name: currentName(), avatarUrl });
      toast?.("Profile saved");
      nav("profile");
    } catch (error) {
      toast?.(error instanceof Error ? error.message : "Could not save profile");
    }
  };
  const changePhoto = () => fileInputRef.current?.click();
  const uploadPhoto = async (file) => {
    setUploadProgress(0);
    try {
      const uploaded = await uploadImage.mutateAsync({
        file,
        onProgress: (pct) => setUploadProgress(pct),
      });
      setAvatarUrl(uploaded.url);
      await updateProfile.mutateAsync({ name: currentName(), avatarUrl: uploaded.url });
      toast?.("Profile photo updated");
    } catch (error) {
      toast?.(error instanceof Error ? error.message : "Could not upload photo");
    } finally {
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const removePhoto = async () => {
    try {
      setAvatarUrl(null);
      await updateProfile.mutateAsync({ name: currentName(), avatarUrl: null });
      toast?.("Profile photo removed");
    } catch (error) {
      setAvatarUrl(user?.avatarUrl ?? null);
      toast?.(error instanceof Error ? error.message : "Could not remove photo");
    }
  };

  const fieldStyle = {
    width: "100%",
    height: 48,
    border: "1.5px solid var(--line-200)",
    borderRadius: "var(--r-md)",
    padding: "0 14px",
    fontSize: ".9375rem",
    fontFamily: "var(--font-sans)",
    outline: "none",
    background: "#fff",
  };
  const labelStyle = {
    display: "block",
    fontSize: ".8125rem",
    fontWeight: 700,
    color: "var(--ink-700)",
    marginBottom: 6,
  };
  const section = {
    background: "#fff",
    border: "1px solid var(--line-200)",
    borderRadius: "var(--r-lg)",
    padding: 20,
    marginBottom: 14,
  };
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 22px 100px" }}
    >
      <AppLink
        href={pathFromScreen("profile")}
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
        <Icon name="chevronLeft" size={16} /> Back
      </AppLink>
      <h1
        style={{
          margin: "0 0 4px",
          fontSize: "1.375rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Edit profile
      </h1>
      <p style={{ margin: "0 0 20px", color: "var(--ink-500)", fontSize: ".875rem" }}>
        Keep details current so deliveries arrive smoothly.
      </p>

      {/* Avatar */}
      <div style={section}>
        <div style={{ fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>
          Profile photo
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <BuyerAvatar user={{ ...user, avatarUrl }} size={72} fontSize="1.5rem" />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadPhoto(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploadImage.isPending || updateProfile.isPending}
              onClick={changePhoto}
            >
              {uploadImage.isPending
                ? uploadProgress
                  ? `Uploading ${uploadProgress}%`
                  : "Uploading..."
                : "Change photo"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!avatarUrl || uploadImage.isPending || updateProfile.isPending}
              onClick={removePhoto}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div style={section}>
        <div style={{ fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>
          Personal details
        </div>
        <div style={grid2}>
          <div>
            <label style={labelStyle}>First name</label>
            <input
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              style={{ ...fieldStyle, padding: "0 12px" }}
            >
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="na">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date of birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={section}>
        <div style={{ fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>Contact</div>
        <label style={labelStyle}>Phone number</label>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-md)",
              overflow: "hidden",
              background: "var(--line-100)",
              flex: 1,
            }}
          >
            <span
              style={{
                padding: "0 12px",
                height: 48,
                display: "flex",
                alignItems: "center",
                color: "var(--ink-500)",
                fontWeight: 700,
                borderRight: "1px solid var(--line-200)",
              }}
            >
              +977
            </span>
            <input
              value={form.phone}
              readOnly
              inputMode="numeric"
              placeholder="Not added yet"
              className="tnum"
              style={{
                flex: 1,
                height: 48,
                border: "none",
                padding: "0 14px",
                fontSize: ".9375rem",
                fontFamily: "var(--font-sans)",
                outline: "none",
                background: "transparent",
                color: "var(--ink-700)",
              }}
            />
          </div>
          <Button variant="secondary" onClick={() => setShowPhoneOtp(true)}>
            {form.phone ? "Change" : "Add"}
          </Button>
        </div>
        <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
          Used for order updates and delivery calls.
        </p>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>
            Email <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>(optional)</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            style={fieldStyle}
          />
          <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
            For invoices and order receipts.
          </p>
        </div>
      </div>

      {/* Default address */}
      <div style={section}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: "var(--ink-900)" }}>Default delivery address</div>
          <button
            onClick={() => toast?.("Open address book")}
            style={{
              background: "none",
              border: "none",
              color: "var(--blue)",
              fontWeight: 700,
              fontSize: ".875rem",
              cursor: "pointer",
            }}
          >
            Manage all
          </button>
        </div>
        <div style={grid2}>
          <div>
            <label style={labelStyle}>Province</label>
            <select
              value={form.province}
              onChange={(e) => set("province", e.target.value)}
              style={{ ...fieldStyle, padding: "0 12px" }}
            >
              {[
                "Koshi",
                "Madhesh",
                "Bagmati",
                "Gandaki",
                "Lumbini",
                "Karnali",
                "Sudurpashchim",
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>District</label>
            <input
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Municipality / VDC</label>
            <input
              value={form.municipality}
              onChange={(e) => set("municipality", e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Ward no.</label>
            <input
              value={form.ward}
              onChange={(e) => set("ward", e.target.value)}
              inputMode="numeric"
              className="tnum"
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Area / Tole</label>
            <input
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nearest landmark</label>
            <input
              value={form.landmark}
              onChange={(e) => set("landmark", e.target.value)}
              placeholder="e.g. Behind Pulchowk Campus"
              style={fieldStyle}
            />
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
              Helps the rider find you faster.
            </p>
          </div>
        </div>
      </div>

      {/* Communication preferences */}
      <div style={section}>
        <div style={{ fontWeight: 800, color: "var(--ink-900)", marginBottom: 4 }}>
          Notifications
        </div>
        <div
          style={{
            fontWeight: 600,
            color: "var(--ink-500)",
            fontSize: ".8125rem",
            marginBottom: 12,
          }}
        >
          Send me deals & order updates via
        </div>
        {[
          {
            k: "inAppConsent",
            label: "In-app notifications",
            sub: "Order updates, delivery alerts, bargain replies",
          },
          { k: "emailConsent", label: "Email", sub: "Invoices, receipts, weekly deals" },
        ].map((o) => (
          <label
            key={o.k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: "1px solid var(--line-100)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form[o.k]}
              onChange={(e) => set(o.k, e.target.checked)}
              style={{ width: 20, height: 20, accentColor: "var(--blue)", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: ".875rem", color: "var(--ink-900)" }}>
                {o.label}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>{o.sub}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Save bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          position: "sticky",
          bottom: 12,
          background: "var(--page)",
          padding: "12px 0 0",
          borderTop: "1px solid transparent",
        }}
      >
        <Button variant="secondary" full href={pathFromScreen("profile")}>
          Cancel
        </Button>
        <Button variant="primary" full disabled={updateProfile.isPending} onClick={save}>
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      {/* Phone change OTP modal */}
      {showPhoneOtp && (
        <div
          onClick={() => {
            setShowPhoneOtp(false);
            setOtpDigits("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 700,
            background: "rgba(11,18,32,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bz-modal"
            style={{
              background: "#fff",
              borderRadius: "var(--r-xl)",
              padding: 24,
              width: "100%",
              maxWidth: 420,
            }}
          >
            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--ink-900)",
              }}
            >
              {form.phone ? "Change phone number" : "Add phone number"}
            </h3>
            <p style={{ margin: "0 0 16px", color: "var(--ink-500)", fontSize: ".875rem" }}>
              Used for order updates and delivery calls.
            </p>
            <label style={labelStyle}>Mobile number</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  padding: "0 12px",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  background: "var(--line-100)",
                  color: "var(--ink-500)",
                  fontWeight: 700,
                }}
              >
                +977
              </span>
              <input
                value={otpDigits}
                onChange={(e) => setOtpDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                placeholder="98XXXXXXXX"
                className="tnum"
                style={{
                  flex: 1,
                  height: 48,
                  border: "none",
                  padding: "0 12px",
                  fontSize: ".9375rem",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setShowPhoneOtp(false);
                  setOtpDigits("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                full
                disabled={!/^9[678]\d{8}$/.test(otpDigits)}
                onClick={() => {
                  setBuyerPhone(otpDigits);
                  set("phone", otpDigits);
                  setShowPhoneOtp(false);
                  setOtpDigits("");
                  toast?.(`Phone number saved · +977 ${otpDigits}`);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
