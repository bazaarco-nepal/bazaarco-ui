// @ts-nocheck — legacy design prototype; typed incrementally
"use client";

import React, { useEffect, useState } from "react";
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
  PasswordInput,
} from "@/components/ui";
import { useCatalog } from "@/hooks/use-catalog";
import { useDeleteAccount, useLogout } from "@/hooks/use-auth";
import { useBargains } from "@/hooks/use-bargains";
import { useAddresses } from "@/hooks/use-addresses";
import { useCancelOrder, useOrders } from "@/hooks/use-orders";
import { canCancelOrder } from "@/lib/order-utils";
import { ConfirmModal } from "@/features/checkout/checkout";
import { useChatInbox } from "@/hooks/use-chat";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName, userInitial } from "@/lib/display";
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
  confirmed: { tone: "blue", label: "Confirmed", action: "Track", actionVariant: "secondary" },
  packed: { tone: "saffron", label: "Packed", action: "Track", actionVariant: "secondary" },
  shipped: {
    tone: "saffron",
    label: "On the way",
    action: "Call rider · राइडरलाई फोन गर्नुहोस्",
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

export function Orders() {
  const { nav, openTracking } = useBz();
  const { data: ordersData = [], isLoading, isError, error } = useOrders();
  const cancelOrder = useCancelOrder();
  const { byId } = useCatalog();
  const [filter, setFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const orders = ordersData.filter((o) => {
    if (filter === "active")
      return ["placed", "applied", "confirmed", "packed", "shipped"].includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 28px 96px" }}>
        <h1
          style={{
            margin: "0 0 24px",
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          My orders{" "}
          <span
            className="ne"
            style={{ color: "var(--ink-500)", fontWeight: 600, fontSize: "1rem" }}
          >
            · मेरा अर्डर
          </span>
        </h1>

        <div style={{ marginBottom: 24 }}>
          <ChipGroup
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="When you order, it shows up here."
            cta="Start shopping"
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
                        Placed {o.placed} · ETA {o.eta}
                      </div>
                    </div>
                    <span
                      className="tnum"
                      style={{ fontWeight: 800, color: "var(--blue-deep)", fontSize: "1.125rem" }}
                    >
                      Rs. {o.total.toLocaleString()}
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
                            o.status === "applied" ||
                            o.status === "shipped" ||
                            o.status === "confirmed" ||
                            o.status === "packed"
                          )
                            openTracking(o.id);
                          else if (o.status === "delivered") nav("review");
                        }}
                        icon={o.status === "shipped" ? "phone" : undefined}
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
          message={`Cancel order #${cancelTarget.id}? You can only cancel before the seller ships your items.`}
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

export function Profile() {
  const { nav, toast } = useBz();
  const logoutMutation = useLogout();
  const deleteMutation = useDeleteAccount();
  const user = useBazaarStore((s) => s.user);
  const { data: bargains = [] } = useBargains();
  const { data: savedAddresses = [] } = useAddresses();
  const { data: chatInbox } = useChatInbox();
  const unreadMessages = (chatInbox?.threads ?? []).reduce((sum, t) => sum + (t.unread || 0), 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const requiresPassword = user?.provider === "local";
  const canDelete =
    deleteText.trim().toUpperCase() === "DELETE" &&
    (!requiresPassword || deletePassword.length > 0) &&
    !deleteMutation.isPending;

  const closeDeleteModal = () => {
    setConfirmDelete(false);
    setDeleteText("");
    setDeletePassword("");
    setDeleteError(null);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast?.("Logged out");
        nav("home");
      },
    });
  };

  const handleDelete = () => {
    if (!canDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(requiresPassword ? { password: deletePassword } : undefined, {
      onSuccess: () => {
        closeDeleteModal();
        toast?.("Account deleted. We're sorry to see you go.");
        nav("home");
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not delete account");
      },
    });
  };

  return (
    <div className="bz-profile">
      <style>{`
        .bz-profile {
          display: grid;
          grid-template-columns: 1fr;
          gap: 22px;
          max-width: var(--container);
          margin: 0 auto;
          padding: 28px 28px 96px;
          align-items: start;
        }
        @media (min-width: 900px) {
          .bz-profile { grid-template-columns: 360px 1fr; gap: 32px; }
        }
        .bz-profile__rail { display: flex; flex-direction: column; gap: 14px; }
        .bz-profile__main { display: flex; flex-direction: column; gap: 10px; }
        .bz-profile__actions { display: flex; flex-direction: column; gap: 14px; }
        /* Mobile: collapse the separate menu cards into one grouped card with
           inset hairline dividers — fewer borders reads calmer and more premium. */
        @media (max-width: 899px) {
          .bz-profile__main {
            gap: 0;
            background: #fff;
            border: 1px solid var(--line-200);
            border-radius: var(--r-xl);
            overflow: hidden;
          }
          .bz-profile__main .bz-menu-row {
            position: relative;
            border: none;
            border-radius: 0;
            padding: 0 20px;
            min-height: 72px;
          }
          .bz-profile__main .bz-menu-row:not(:first-child)::before {
            content: "";
            position: absolute;
            top: 0;
            left: 64px;
            right: 0;
            height: 1px;
            background: var(--line-100);
          }
        }
        @media (min-width: 900px) {
          .bz-profile__rail    { grid-column: 1; grid-row: 1; }
          .bz-profile__actions { grid-column: 1; grid-row: 2; }
          .bz-profile__main    { grid-column: 2; grid-row: 1 / span 2; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; align-content: start; }
          .bz-profile__main > .bz-profile__full { grid-column: 1 / -1; }
        }
        .bz-profile__card {
          background: #fff;
          border: 1px solid var(--line-200);
          border-radius: var(--r-lg);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .bz-profile__divider {
          height: 1px;
          background: var(--line-200);
          margin: 2px 0;
        }
        .bz-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1px solid var(--line-200);
          border-radius: var(--r-md);
          background: #fff;
          color: var(--danger);
          font-family: inherit;
          font-weight: 700;
          font-size: .9375rem;
          line-height: 1;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .bz-logout-btn:hover { background: var(--tint-red-50); border-color: var(--danger); }
        .bz-delete-link {
          align-self: flex-end;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          padding: 4px 2px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: .8125rem;
          color: var(--danger);
          opacity: .6;
          transition: opacity .15s;
        }
        .bz-delete-link:hover { opacity: 1; }
      `}</style>

      {/* LEFT RAIL — single cohesive card: identity + account actions */}
      <aside className="bz-profile__rail">
        <div className="bz-profile__card">
          {/* Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--blue-deep)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.5rem",
                flexShrink: 0,
              }}
            >
              {userInitial(user)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 800 }}>
                {displayName(user, "Guest")}
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: ".875rem",
                  color: "var(--ink-500)",
                  wordBreak: "break-all",
                }}
              >
                {user?.email ?? ""}
              </div>
            </div>
            <Button variant="ghost" href={pathFromScreen("profile-edit")}>
              Edit
            </Button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN — action grid */}
      <div className="bz-profile__main">
        <MenuRow
          icon="package"
          label="My orders"
          sub="Track, return, re-order"
          href={pathFromScreen("orders")}
          onClick={() => nav("orders")}
        />
        <MenuRow
          icon="heart"
          label="Wishlist"
          sub="Saved products"
          href={pathFromScreen("wishlist")}
          onClick={() => nav("wishlist")}
        />
        <MenuRow
          icon="messageDots"
          label="My messages"
          sub={unreadMessages ? `${unreadMessages} unread` : "Chats with sellers"}
          href={pathFromScreen("messages")}
          onClick={() => nav("messages")}
          badge={unreadMessages > 0 ? String(unreadMessages) : undefined}
        />
        <MenuRow
          icon="bargain"
          label="My bargains"
          sub={bargains.length ? `${bargains.length} offer(s)` : "No active offers"}
          href={pathFromScreen("bargains")}
          onClick={() => nav("bargains")}
          badge={bargains.length > 0 ? String(bargains.length) : undefined}
        />
        <MenuRow
          icon="mapPin"
          label="Saved addresses"
          sub={
            savedAddresses.length
              ? `${savedAddresses.length} saved · ${savedAddresses.find((a) => a.isDefault)?.label ?? "Home"} default`
              : "Add Home, Office, and more"
          }
          href={pathFromScreen("addresses")}
          onClick={() => nav("addresses")}
        />
        <MenuRow
          icon="headphones"
          label="Help & support"
          sub="Chat, call, FAQs"
          href={pathFromScreen("help")}
          onClick={() => nav("help")}
        />
        <MenuRow
          icon="lock"
          label="Privacy policy"
          sub="How we handle your data"
          href={pathFromScreen("privacy")}
          onClick={() => nav("privacy")}
        />
        <MenuRow
          icon="file"
          label="Terms & conditions"
          sub="Marketplace rules"
          href={pathFromScreen("terms")}
          onClick={() => nav("terms")}
        />
      </div>

      {/* ACCOUNT ACTIONS — bottom on mobile, left-rail bottom on desktop */}
      <div className="bz-profile__actions">
        <div className="bz-profile__card">
          <button className="bz-logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={18} color="var(--danger)" />
            Log out
          </button>
          <button className="bz-delete-link" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" size={14} color="var(--danger)" />
            Delete my account
          </button>
        </div>
      </div>

      {/* Account deletion confirmation modal */}
      {confirmDelete && (
        <div
          onClick={closeDeleteModal}
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
                marginBottom: requiresPassword ? 12 : 18,
                letterSpacing: ".02em",
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
                    marginBottom: 18,
                  }}
                />
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
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" full onClick={closeDeleteModal}>
                Keep account
              </Button>
              <Button variant="danger" full disabled={!canDelete} onClick={handleDelete}>
                {deleteMutation.isPending ? "Deleting…" : "Delete forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WriteReview({ productId }: WriteReviewProps) {
  const { nav, toast } = useBz();
  const { byId, products } = useCatalog();
  const p = productId ? byId(productId) : products[0];
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState(0);

  const submit = () => {
    toast("Thanks! Review posted.");
    nav("orders");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 28px 80px" }}>
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
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 3 }}>
            Delivered May 18
          </div>
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
          Tap the stars · ताराहरूमा थिच्नुहोस्
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
          ? "Add photos · फोटो थप्नुहोस्"
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
        <Button variant="primary" size="lg" full disabled={rating === 0} onClick={submit}>
          Post review · प्रकाशित गर्नुहोस्
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
  const [form, setForm] = useState(() => profileFormFromUser(user));
  useEffect(() => {
    setForm(profileFormFromUser(user));
  }, [user]);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => {
    toast?.("Profile saved · प्रोफाइल सुरक्षित");
    nav("profile");
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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 22px 100px" }}>
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
          <span
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--blue-deep)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            {userInitial(user)}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => toast?.("Open camera or gallery")}>
              Change photo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast?.("Photo removed")}>
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
            Change
          </Button>
        </div>
        <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
          We verify phone changes with an OTP.
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
        <Button variant="primary" full onClick={save}>
          Save changes
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
              Change phone number
            </h3>
            <p style={{ margin: "0 0 16px", color: "var(--ink-500)", fontSize: ".875rem" }}>
              Enter your new phone number. We'll send an OTP.
            </p>
            <label style={labelStyle}>New phone</label>
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
                disabled={!/^9\d{9}$/.test(otpDigits)}
                onClick={() => {
                  setShowPhoneOtp(false);
                  toast?.(`OTP sent to +977 ${otpDigits}`);
                }}
              >
                Send OTP
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
