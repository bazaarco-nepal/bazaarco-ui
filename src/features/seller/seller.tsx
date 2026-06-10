"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  StoreAvatar,
} from "@/components/ui";
import { ProductPhotoPicker, type ProductPhoto } from "@/components/seller/product-photo-picker";
import { ProductDeleteConfirmModal } from "@/components/seller/product-delete-confirm-modal";
import { SellerVideoLibrary } from "@/components/seller/seller-video-library";
import {
  SellerVerificationBanner,
  SellerVerificationBlocked,
} from "@/components/seller/seller-verification-banner";
import { StoreSwitcherChip } from "./store-switcher";
import {
  useCompleteOnboarding,
  useLogout,
  useCurrentUser,
  useUpdateProfile,
} from "@/hooks/use-auth";
import { usePendingSellerVerifications, useReviewSellerVerification } from "@/hooks/use-admin";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName, userInitial } from "@/lib/display";
import { saleEffective, saleValid as isSaleValid, buildPricing } from "@/lib/discount";
import {
  clearDeferredSellerOnboarding,
  deferSellerOnboarding,
  isSellerOnboardingDeferred,
} from "@/lib/seller-onboarding";
import { useCategories, useProduct } from "@/hooks/use-catalog";
import {
  useAcceptBargainOffer,
  useRejectBargainOffer,
  useCounterBargainOffer,
} from "@/hooks/use-bargains";
import { useUploadImage } from "@/hooks/use-media-upload";
import type { CreateProductVariantPayload, SellerInventoryItem } from "@/services/api/seller";
import type { SellerStoreSummary } from "@/services/api/seller-organization";
import type { CategoryAttributeField } from "@/types";
import type { OrderStatus } from "@/lib/order-utils";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSellerDashboard,
  useSellerInbox,
  useSellerInventory,
  useAcknowledgeProductModeration,
  useSellerBargains,
  useSellerReviews,
  useSellerVideos,
  useSellerAnalytics,
  useSellerNotifications,
  useSellerSettings,
  useUpdateSellerSettings,
  useSellerOrganization,
  useSetupSellerOrganization,
  useSubmitSellerVerification,
  useSellerStorefront,
  useUpdateStorefront,
  useUploadStorefrontBanner,
  useUploadStorefrontLogo,
  useRemoveStorefrontLogo,
  useSellerLedger,
  useUpdateSellerOrderStatus,
} from "@/hooks/use-seller";
import { useChatInbox, useChatMessages, useInvalidateChat } from "@/hooks/use-chat";
import {
  connectChatSocket,
  disconnectChatSocket,
  emitTypingStart,
  emitTypingStop,
  joinConversation,
  leaveConversation,
  sendChatMessage,
} from "@/lib/chat-socket";
import { ImageCropModal } from "@/components/common/image-crop-modal";
import { chatApi, type ChatMessage, type ChatThread } from "@/services/api/chat";
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
  PasswordResetModal,
  LogoutConfirmModal,
  SellerDeleteAccountModal,
  LanguageToggle,
} from "@/components/common";
import { ASSETS } from "@/config/assets";
import { pathFromScreen, storeShareUrl } from "@/config/routes";
import { ApiRequestError } from "@/services/api/http";
import { emptyStoreAddress, formatStoreAddress, type StoreAddress } from "@/lib/store-address";

export type SellerInboxOrderItem = {
  id: string;
  buyer: string;
  buyerAvatarUrl?: string | null;
  city: string;
  item: string;
  qty: number;
  price: number;
  pay: string;
  status: OrderStatus;
  time: string;
  phone: string;
  icon: string;
  tint: string;
  canCancel: boolean;
  // Multi-seller order: this seller accepted, but the order waits in "placed"
  // until the remaining sellers confirm their parcels too.
  awaitingOtherSellers?: boolean;
};

export const sellerOrderRef = { current: null as SellerInboxOrderItem | null };

// Threads the inventory row a seller tapped "Edit" on through to the edit
// screen (the SPA router renders screens by id and can't carry props itself).
// Mirrors `sellerOrderRef`. Holds the inventory item for stock/variant prefill;
// the full product (description, category, specs) is fetched by id on the screen.
export const editProductRef = { current: null as SellerInventoryItem | null };

// Threads the inventory row a seller tapped "View" on through to the view screen.
export const viewProductRef = { current: null as SellerInventoryItem | null };

export const SELLER_NAV = [
  {
    groupKey: "seller.groupMyShop",
    items: [
      { id: "s-dashboard", icon: "home", labelKey: "seller.navHome" },
      { id: "s-add", icon: "plus", labelKey: "seller.navAddProduct" },
      { id: "s-inbox", icon: "package", labelKey: "seller.navOrders", badgeKey: "orders" },
      { id: "s-products", icon: "store", labelKey: "seller.navProducts" },
      { id: "s-chat", icon: "message", labelKey: "seller.navMessages", badgeKey: "chat" },
      { id: "s-videos", icon: "video", labelKey: "seller.navVideos" },
    ],
  },
  {
    groupKey: "seller.groupMore",
    items: [
      { id: "s-storefront", icon: "palette", labelKey: "seller.navStorefront" },
      { id: "s-bargain", icon: "bargain", labelKey: "seller.navBargaining", badgeKey: "bargain" },
      { id: "s-ledger", icon: "wallet", labelKey: "seller.navMoney" },
      { id: "s-analytics", icon: "trendingUp", labelKey: "seller.navAnalytics" },
      { id: "s-reviews", icon: "star", labelKey: "seller.navReviews" },
      { id: "s-verification", icon: "shieldCheck", labelKey: "seller.navKyc" },
      { id: "s-settings", icon: "settings", labelKey: "seller.navSettings" },
    ],
  },
];

export function SellerSidebar({
  screen,
  onNav,
  collapsed,
  setCollapsed,
  openMobile,
  setOpenMobile,
  badges = {},
  stores = [],
  activeSellerId = null,
}: {
  screen: string;
  onNav: (screen: string) => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  badges?: Record<string, number>;
  stores?: SellerStoreSummary[];
  activeSellerId?: string | null;
}) {
  const { t } = useTranslation();
  const close = () => setOpenMobile(false);
  const logoutMutation = useLogout();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmLogout(false);
        close();
        onNav("home");
      },
    });
  };
  return (
    <>
      <div className={"bz-side-overlay" + (openMobile ? " show" : "")} onClick={close} />
      <aside
        className={"bz-seller-side" + (collapsed ? " collapsed" : "") + (openMobile ? " open" : "")}
      >
        {/* ── Sidebar header ── */}
        <div
          style={{
            padding: collapsed ? "12px 8px 10px" : "14px 10px 12px 14px",
            borderBottom: "1px solid var(--line-200)",
          }}
        >
          {/* The store chip doubles as the active-store identity and the switcher
              trigger. It's always present so adding/switching stores is reachable
              even with a single store and on a collapsed sidebar. */}
          {collapsed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <StoreSwitcherChip
                variant="sidebar-collapsed"
                stores={stores}
                activeSellerId={activeSellerId}
              />
              <button
                className="bz-side-toggle"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={t("seller.expandSidebar")}
                title={t("seller.expandSidebar")}
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StoreSwitcherChip
                variant="sidebar"
                stores={stores}
                activeSellerId={activeSellerId}
              />
              <button
                className="bz-side-toggle"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={t("seller.collapseSidebar")}
                title={t("seller.collapseSidebar")}
              >
                <Icon name="chevronLeft" size={14} />
              </button>
            </div>
          )}
        </div>

        <div
          className="bz-side-scroll"
          style={{ flex: 1, paddingTop: "6px", paddingInline: 0, overflowY: "auto" }}
        >
          {SELLER_NAV.map((grp) => (
            <div key={grp.groupKey}>
              <div className="bz-side-group">{t(grp.groupKey)}</div>
              {grp.items.map((it) => {
                const active = screen === it.id;
                const badge = it.badgeKey ? (badges[it.badgeKey] ?? 0) : 0;
                const showBadge = badge > 0;
                const label = t(it.labelKey);
                return (
                  <button
                    key={it.id}
                    className={"bz-side-item" + (active ? " active" : "")}
                    onClick={() => {
                      onNav(it.id);
                      close();
                    }}
                    title={label}
                  >
                    <Icon
                      name={it.icon}
                      size={20}
                      color={active ? "var(--red)" : "var(--ink-700)"}
                    />
                    <span className="bz-side-label">
                      <span className="bz-side-en">{label}</span>
                    </span>
                    {showBadge ? <span className="bz-side-badge">{badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bz-side-foot">
          <button
            className="bz-side-item bz-side-logout"
            onClick={() => setConfirmLogout(true)}
            title={t("seller.logOut")}
          >
            <Icon name="logout" size={20} color="var(--red)" />
            <span className="bz-side-label">
              <span className="bz-side-en">{t("seller.logOut")}</span>
            </span>
          </button>
        </div>
      </aside>
      <LogoutConfirmModal
        open={confirmLogout}
        pending={logoutMutation.isPending}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}

export function SellerShell({ screen, children }: { screen: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const { nav } = useBz();
  const { data: organization, isLoading: orgLoading } = useSellerOrganization();
  const { data: inbox = [] } = useSellerInbox();
  const { data: bargains = [] } = useSellerBargains();
  const { data: chatInbox } = useChatInbox();
  const chatThreads = chatInbox?.threads ?? [];
  const newOrders = inbox.filter(
    (o: SellerInboxOrderItem) => o.status === "placed" && !o.awaitingOtherSellers,
  ).length;
  const badges = {
    orders: newOrders,
    chat: chatThreads.reduce((sum, t) => sum + (t.unread ?? 0), 0),
    bargain: bargains.filter(
      (b: { status?: string; accepted?: boolean; rejected?: boolean }) =>
        bargainStatus(b) === "pending",
    ).length,
  };
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("bz-seller-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("bz-seller-collapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    const h = () => setOpenMobile(true);
    window.addEventListener("bz-seller-menu", h);
    return () => window.removeEventListener("bz-seller-menu", h);
  }, []);

  useEffect(() => {
    if (!openMobile) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const appScroll = document.getElementById("app-scroll");
    const previousBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousAppOverscroll = appScroll?.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    if (appScroll) appScroll.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBody.overflow;
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.width = previousBody.width;
      if (appScroll) appScroll.style.overscrollBehavior = previousAppOverscroll ?? "";
      window.scrollTo(0, scrollY);
    };
  }, [openMobile]);

  useEffect(() => {
    if (orgLoading || screen === "s-onboarding") return;
    if (organization && !organization.linked && !isSellerOnboardingDeferred()) {
      nav("s-onboarding");
    }
  }, [organization, orgLoading, screen, nav]);

  return (
    <div className={"bz-seller-shell" + (collapsed ? " collapsed" : "")}>
      <SellerSidebar
        screen={screen}
        onNav={nav}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        openMobile={openMobile}
        setOpenMobile={setOpenMobile}
        badges={badges}
        stores={organization?.stores ?? []}
        activeSellerId={organization?.sellerId ?? null}
      />
      <section className="bz-side-content">
        <div className="bz-side-mobile-bar">
          <button
            onClick={() => setOpenMobile(true)}
            aria-label={t("seller.menu")}
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-200)",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon name="menu" size={22} />
          </button>
          {/* Active-store chip is the primary identity on mobile and opens the
              switcher bottom sheet without having to open the nav drawer. */}
          <StoreSwitcherChip
            variant="mobilebar"
            stores={organization?.stores ?? []}
            activeSellerId={organization?.sellerId ?? null}
          />
        </div>
        {organization?.linked &&
          organization.verification &&
          organization.verification.status !== "approved" && (
            <div
              className="bz-container-pad"
              style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "16px 28px 0" }}
            >
              <SellerVerificationBanner
                status={organization.verification.status}
                note={organization.verification.note}
              />
            </div>
          )}
        {children}
      </section>
    </div>
  );
}

/* ---------- Admin: seller verification queue ---------- */

function isAdminUser(email: string | undefined): boolean {
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email || list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export function AdminSellerVerifications() {
  const { data: me } = useCurrentUser();
  const {
    data: pending = [],
    isLoading,
    isError,
    refetch,
  } = usePendingSellerVerifications(isAdminUser(me?.email));
  const review = useReviewSellerVerification();

  if (!isAdminUser(me?.email)) {
    return (
      <div className="bz-seller-page">
        <p style={{ color: "var(--ink-600)" }}>
          Admin access only. Set NEXT_PUBLIC_ADMIN_EMAILS to match your login.
        </p>
      </div>
    );
  }

  return (
    <div className="bz-seller-page">
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        Seller verifications
      </h1>
      <p style={{ margin: "0 0 20px", color: "var(--ink-500)", fontSize: ".875rem" }}>
        Approve NID/PAN uploads before sellers can add products or videos.
      </p>
      {isLoading && <p>Loading…</p>}
      {isError && (
        <p style={{ color: "var(--red)" }}>
          Could not load queue. Check ADMIN_EMAILS on the backend matches your account.
        </p>
      )}
      {!isLoading && pending.length === 0 && (
        <p style={{ color: "var(--ink-500)" }}>No pending verifications.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {pending.map((row) => (
          <div
            key={row.sellerId}
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {row.verification.docUrl && (
                <a href={row.verification.docUrl} target="_blank" rel="noreferrer">
                  <img
                    src={row.verification.docUrl}
                    alt=""
                    style={{
                      width: 140,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: "var(--r-sm)",
                      border: "1px solid var(--line-200)",
                    }}
                  />
                </a>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{row.shopName}</div>
                <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 4 }}>
                  {row.userEmail} · {row.verification.docType?.toUpperCase()}
                  {row.verification.docIdNumber ? ` · ${row.verification.docIdNumber}` : ""}
                </div>
                {row.verification.ownerName && (
                  <div style={{ fontSize: ".8125rem", marginTop: 6 }}>
                    {row.verification.ownerName}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate(
                        { sellerId: row.sellerId, action: "approve" },
                        { onSuccess: () => void refetch() },
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={review.isPending}
                    onClick={() =>
                      review.mutate(
                        {
                          sellerId: row.sellerId,
                          action: "reject",
                          note: "Document unclear or invalid",
                        },
                        { onSuccess: () => void refetch() },
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shared seller chrome ---------- */

// Help lifeline removed — no floating help FAB on seller screens. Kept as a
// no-op so existing render sites stay valid.
export function SellerHelpBar() {
  return null;
}

/* ---------- 4.1 Seller Onboarding ---------- */
export function SellerOnboarding() {
  const { t } = useTranslation();
  const { nav, toast } = useBz();
  const user = useBazaarStore((s) => s.user);
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const savedStatus = verification?.status ?? "none";
  const setupOrganization = useSetupSellerOrganization();
  const submitVerification = useSubmitSellerVerification();
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState("hero"); // hero | docPick | docUpload | review | done
  const [docType, setDocType] = useState<"pan" | "nid" | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [scanned, setScanned] = useState<{
    name: string;
    shop: string;
    docLabel: string;
    docId: string;
    address: string;
  } | null>(null);
  const [shopName, setShopName] = useState("");
  const [storeAddress, setStoreAddress] = useState<StoreAddress>(emptyStoreAddress);

  const finishSetup = async () => {
    const name = (scanned?.shop || shopName || "").trim();
    const owner = (scanned?.name || "").trim();
    if (name.length < 2) {
      toast("Enter your store name to continue");
      return;
    }
    if (owner.length < 2) {
      toast("Enter the owner name to continue");
      return;
    }
    if (!docFile || !docType) {
      toast("Upload your NID or PAN photo first");
      return;
    }
    const storeCity = (storeAddress.city || "").trim();
    if (storeCity.length < 1) {
      toast("Enter your store location");
      return;
    }
    try {
      await setupOrganization.mutateAsync({
        shopName: name,
        storeAddress: {
          city: storeCity,
          ...(storeAddress.area?.trim() ? { area: storeAddress.area.trim() } : {}),
          ...(storeAddress.landmark?.trim() ? { landmark: storeAddress.landmark.trim() } : {}),
          ...(storeAddress.lat != null ? { lat: storeAddress.lat } : {}),
          ...(storeAddress.lng != null ? { lng: storeAddress.lng } : {}),
        },
      });
      await submitVerification.mutateAsync({
        file: docFile,
        docType,
        docIdNumber: scanned?.docId?.trim() || undefined,
        ownerName: owner,
        address: scanned?.address?.trim() || undefined,
      });
      clearDeferredSellerOnboarding();
      setStage("done");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not register your shop");
    }
  };

  const startDocUpload = (type: "pan" | "nid") => {
    setDocType(type);
    setScanned({
      // Pre-fill owner from the signup full name; the seller can correct it.
      name: user?.name ?? "",
      shop: "",
      docLabel: type === "pan" ? "PAN" : "NID",
      docId: "",
      address: "",
    });
    setStage("docUpload");
  };

  const onDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast("Please choose an image file");
      return;
    }
    if (docPreview) URL.revokeObjectURL(docPreview);
    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
  };

  // Honour server-saved verification state so re-entering onboarding never
  // discards a submission. Driven off the live query (not local state) so it
  // also reflects a submission made moments ago in this same session.
  // - approved → already done; send them to the dashboard
  // - pending  → submitted; show a calm "in review" screen, no restart
  // Only "none"/"rejected" fall through to the actual upload flow below.
  if (savedStatus === "approved") {
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <SellerHelpBar />
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(22,163,74,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <Icon name="badgeCheck" size={42} color="var(--success)" />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>You&apos;re verified</h1>
            <div style={{ marginTop: 24 }}>
              <Button variant="primary" size="lg" full href={pathFromScreen("s-dashboard")}>
                Open dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (savedStatus === "pending" && stage !== "done") {
    const submittedDoc = verification?.docType === "pan" ? "PAN" : "NID";
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <SellerHelpBar />
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(247,127,0,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <Icon name="shieldCheck" size={42} color="var(--saffron)" />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>
              You&apos;re all set — keep going
            </h1>
            <p style={{ color: "var(--ink-600)", marginTop: 8, fontSize: ".9375rem" }}>
              Your {submittedDoc} is submitted. Keep using your dashboard as usual — our team is
              checking your KYC and will update you soon. No need to upload anything again.
            </p>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "rgba(247,127,0,.08)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                color: "var(--blue-deep)",
                textAlign: "left",
              }}
            >
              <Icon
                name="shieldCheck"
                size={16}
                color="var(--saffron)"
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              Adding products and videos turns on once your KYC is approved — we&apos;ll let you
              know.
            </div>
            <div style={{ marginTop: 24 }}>
              <Button variant="primary" size="lg" full href={pathFromScreen("s-dashboard")}>
                Open dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <SellerHelpBar />

        {stage === "hero" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <img
              src={ASSETS.mascot}
              alt=""
              style={{ width: 180, height: 180, objectFit: "contain", marginBottom: 10 }}
            />
            <h1
              style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}
            >
              Open your shop on <span style={{ color: "var(--red)" }}>BazaarCo</span>
            </h1>

            <div
              style={{
                background: "var(--tint-blue-50)",
                borderRadius: "var(--r-md)",
                padding: 14,
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
              }}
            >
              <Icon name="play" size={26} color="var(--blue)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "var(--blue-deep)" }}>Watch 60-sec guide</div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--blue)" />
            </div>

            <div style={{ marginTop: 22, textAlign: "left", padding: "0 4px" }}>
              {[
                ["Low commission marketplace", "percent", "/legal/commission-information"],
                ["Add a product in 3 taps", "plus"],
                ["Daily payouts to eSewa / Khalti", "wallet"],
              ].map(([t, i, href], idx, arr) => (
                <AppLink
                  key={t}
                  href={href || "#"}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: idx < arr.length - 1 ? "1px dashed var(--line-200)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                    cursor: href ? "pointer" : "default",
                  }}
                >
                  <Icon name={i ?? ""} size={22} color="var(--blue)" />
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{t}</div>
                  </div>
                </AppLink>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <Button
                variant="primary"
                size="lg"
                full
                icon="image"
                onClick={() => {
                  clearDeferredSellerOnboarding();
                  setStage("docPick");
                }}
              >
                Register your shop
              </Button>
              <Button
                variant="ghost"
                full
                style={{ marginTop: 10 }}
                onClick={() => {
                  deferSellerOnboarding();
                  nav("s-dashboard");
                }}
              >
                I'll do this later
              </Button>
            </div>
          </div>
        )}

        {stage === "docPick" && (
          <div>
            <button
              onClick={() => setStage("hero")}
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
              }}
            >
              <Icon name="chevronLeft" size={16} /> Back
            </button>
            <h2
              style={{
                margin: 0,
                fontSize: "1.375rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              Which document do you have?
            </h2>

            {[
              {
                id: "pan",
                icon: "package",
                title: "PAN Card",
                sub: "Registered business · sell any volume",
              },
              {
                id: "nid",
                icon: "user",
                title: "NID Card",
                sub: "Individual seller · PAN required once sales cross IRD limit",
              },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => startDocUpload(d.id as "pan" | "nid")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#fff",
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 18,
                  marginBottom: 12,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--r-md)",
                    background: "var(--tint-blue-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={d.icon} size={28} color="var(--blue)" />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "1rem" }}>{d.title}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>
                    {d.sub}
                  </div>
                </div>
                <Icon name="chevronRight" size={22} color="var(--ink-400)" />
              </button>
            ))}

            <div
              style={{
                background: "var(--tint-blue-50)",
                borderRadius: "var(--r-md)",
                padding: 12,
                fontSize: ".8125rem",
                color: "var(--blue-deep)",
                display: "flex",
                gap: 8,
                marginTop: 6,
              }}
            >
              <Icon name="badgeCheck" size={16} color="var(--blue)" />
              <span>
                No document? Call{" "}
                <a href="tel:16600121234" style={{ color: "var(--blue)", fontWeight: 700 }}>
                  16600-12-12-34
                </a>{" "}
                — we visit you.
              </span>
            </div>
          </div>
        )}

        {stage === "docUpload" && (
          <div>
            <button
              onClick={() => setStage("docPick")}
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
              }}
            >
              <Icon name="chevronLeft" size={16} /> Back
            </button>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.25rem", fontWeight: 800 }}>
              Upload your {docType === "pan" ? "PAN" : "NID"} photo
            </h2>
            <input
              ref={docInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={onDocFile}
            />
            {docPreview ? (
              <img
                src={docPreview}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 220,
                  objectFit: "contain",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--line-200)",
                  marginBottom: 12,
                  background: "var(--line-100)",
                }}
              />
            ) : null}
            <Button
              variant="secondary"
              full
              icon="image"
              onClick={() => docInputRef.current?.click()}
            >
              {docPreview ? "Choose another photo" : "Choose from gallery or camera"}
            </Button>
            <div style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                full
                size="lg"
                disabled={!docFile}
                onClick={() => setStage("review")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {stage === "review" && scanned && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--success)",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <Icon name="check" size={20} color="var(--success)" /> Document uploaded
            </div>
            <h2 style={{ margin: "0 0 16px", fontSize: "1.25rem", fontWeight: 800 }}>
              Confirm your details
            </h2>
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Store name (required)
              </label>
              <input
                value={scanned.shop || shopName}
                onChange={(e) => {
                  const v = e.target.value;
                  setShopName(v);
                  setScanned((s) => (s ? { ...s, shop: v } : s));
                }}
                placeholder="e.g. Bhaktapur Handicraft"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".9375rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Owner name (required)
              </label>
              <input
                value={scanned.name ?? ""}
                onChange={(e) => setScanned((s) => (s ? { ...s, name: e.target.value } : s))}
                placeholder="Full name as on your document"
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".9375rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: ".75rem",
                  color: "var(--ink-400)",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                {t("seller.storeLocation")} (required)
              </label>
              <LandmarkAddress value={storeAddress} onChange={setStoreAddress} />
            </div>
            {(
              [
                [`${scanned.docLabel} no.`, "docId"],
                [t("seller.kycAddress"), "address"],
              ] as [string, "name" | "shop" | "docLabel" | "docId" | "address"][]
            ).map(([label, key]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <label
                  style={{
                    fontSize: ".75rem",
                    color: "var(--ink-400)",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  value={scanned[key] ?? ""}
                  onChange={(e) => setScanned((s) => (s ? { ...s, [key]: e.target.value } : s))}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 12px",
                    border: "1.5px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    fontSize: ".9375rem",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>
            ))}
            <div style={{ marginTop: 18 }}>
              <Button
                variant="primary"
                full
                size="lg"
                disabled={setupOrganization.isPending || submitVerification.isPending}
                onClick={() => void finishSetup()}
              >
                {setupOrganization.isPending || submitVerification.isPending
                  ? "Submitting for review…"
                  : "Submit for admin review"}
              </Button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(22,163,74,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <Icon name="check" size={42} color="var(--success)" />
            </div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Submitted for review</h1>
            <p style={{ color: "var(--ink-500)", marginTop: 6 }}>
              BazaarCo admin will verify your {docType === "pan" ? "PAN" : "NID"}. You can use the
              dashboard meanwhile.
            </p>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "rgba(247,127,0,.08)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                color: "var(--blue-deep)",
                textAlign: "left",
              }}
            >
              <Icon
                name="shieldCheck"
                size={16}
                color="var(--saffron)"
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              Adding products and videos unlocks after approval.
            </div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="primary" size="lg" full href={pathFromScreen("s-dashboard")}>
                Open dashboard
              </Button>
              <Button variant="ghost" full href={pathFromScreen("s-onboarding")}>
                Re-upload document
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 4.2 Seller Dashboard ---------- */

/* Inline SVG charts (no deps) */

export function SellerBarChart({
  data,
  height = 280,
  summaryTotalLabel = "7-day total",
}: {
  data: { label: string; value: number }[];
  height?: number;
  summaryTotalLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const peakIdx = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? 0) ? i : best), 0);
  const chartH = Math.max(height - 72, 160);
  // With many buckets (24 hourly / 30 daily) the per-bar amount labels overlap,
  // so only show them for the sparser week view.
  const showBarValues = data.length <= 10;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: summaryTotalLabel,
            value: `Rs. ${total.toLocaleString("en-IN")}`,
            tint: "var(--blue-deep)",
          },
          {
            label: "Daily average",
            value: `Rs. ${avg.toLocaleString("en-IN")}`,
            tint: "var(--ink-700)",
          },
          {
            label: "Best day",
            value: data[peakIdx]?.value
              ? `${data[peakIdx].label} · Rs. ${data[peakIdx].value.toLocaleString("en-IN")}`
              : "—",
            tint: "var(--saffron)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: "1 1 140px",
              padding: "12px 14px",
              background: "var(--line-100)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-200)",
            }}
          >
            <div
              style={{
                fontSize: ".7rem",
                fontWeight: 700,
                color: "var(--ink-500)",
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {s.label}
            </div>
            <div
              className="tnum"
              style={{ fontSize: "1rem", fontWeight: 800, color: s.tint, marginTop: 4 }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 10,
          height: chartH,
          padding: "8px 4px 0",
          background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--line-100)",
        }}
      >
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const barPct = Math.max(pct, d.value > 0 ? 8 : 4);
          const isPeak = i === peakIdx && d.value > 0;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              {showBarValues && (
                <div
                  className="tnum"
                  style={{
                    fontSize: ".68rem",
                    fontWeight: 700,
                    color: d.value > 0 ? "var(--ink-700)" : "var(--ink-400)",
                    marginBottom: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.value > 0 ? `Rs.${d.value.toLocaleString("en-IN")}` : "—"}
                </div>
              )}
              <div
                title={`${d.label}: Rs. ${d.value.toLocaleString("en-IN")}`}
                style={{
                  width: "100%",
                  maxWidth: 64,
                  height: `${barPct}%`,
                  minHeight: d.value > 0 ? 12 : 6,
                  borderRadius: "10px 10px 4px 4px",
                  background: isPeak
                    ? "linear-gradient(180deg, #fbbf24 0%, #f77f00 45%, #e63946 100%)"
                    : d.value > 0
                      ? "linear-gradient(180deg, #60a5fa 0%, #1d4ed8 100%)"
                      : "var(--line-200)",
                  boxShadow: isPeak
                    ? "0 4px 14px rgba(230,57,70,.25)"
                    : "0 2px 8px rgba(29,78,216,.15)",
                  transition: "height .2s ease",
                }}
              />
              <div
                style={{
                  marginTop: 10,
                  fontSize: ".75rem",
                  fontWeight: isPeak ? 800 : 600,
                  color: isPeak ? "var(--red)" : "var(--ink-500)",
                }}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SellerSparkline({
  data,
  color = "var(--blue)",
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1),
    min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / range) * 26}`)
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points={`0,30 ${pts} 100,30`} fill={color} opacity=".12" />
    </svg>
  );
}

export function SellerDonut({
  slices,
  size = 160,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40,
    c = 50,
    circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
      >
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-100)" strokeWidth="14" />
        {slices.map((s, i) => {
          const len = (s.value / total) * circ;
          const off = circ - acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={off}
            />
          );
        })}
      </svg>
      <div style={{ flex: 1 }}>
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: i < slices.length - 1 ? "1px dashed var(--line-200)" : "none",
            }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: ".875rem" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
              <span style={{ fontWeight: 600 }}>{s.label}</span>
            </span>
            <span className="tnum" style={{ fontWeight: 800, fontSize: ".875rem" }}>
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Seller's public storefront link — the one thing a seller most wants to hand
 * out. Shows the shop identity, the readable URL, and one primary action
 * (native share, copy fallback). Renders nothing until we know the seller's id.
 */
function StoreLinkCard() {
  const { t } = useTranslation();
  const { toast } = useBz();
  const { data: organization } = useSellerOrganization();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // window.location.origin is client-only; pass "" on the server render so the
  // first client render matches it (no hydration mismatch), then fill it in.
  useEffect(() => {
    setOrigin(window.location.origin.replace(/\/$/, ""));
  }, []);

  const sellerId = organization?.sellerId;
  if (!sellerId) return null;

  const shopName = organization?.shopName?.trim() || "BazaarCo";
  const fullUrl = storeShareUrl(sellerId, origin);
  const displayUrl = fullUrl.replace(/^https?:\/\//, "");
  const logoUrl = organization?.logoUrl;
  const isLive = organization?.verification?.canSell ?? false;

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
        <button
          type="button"
          className={"bz-store-link__copy" + (copied ? " is-copied" : "")}
          onClick={copyLink}
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? t("seller.dashboard.storeLinkCopied") : t("seller.dashboard.storeLinkCopy")}
        </button>
      </div>
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
  const sellerName = displayName(user, "Seller");
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
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
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
              <Icon name="lock" size={20} color="var(--red)" style={{ flexShrink: 0 }} />
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--red)" }}>
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
              Fix the issues described in each product, then acknowledge so our team can review and
              restore your listing.
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
                      fontWeight: 700,
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
              style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}
            >
              {t("seller.dashboard.greeting", { name: sellerName })}{" "}
              <span style={{ fontSize: "1.5rem" }}>🙏</span>
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
              {today}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ChipGroup
              options={[
                { value: "today", label: t("seller.common.today") },
                { value: "week", label: t("seller.common.week7") },
                { value: "month", label: t("seller.common.month30") },
              ]}
              value={range}
              onChange={setRange}
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
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 24,
                textAlign: "center",
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                color: "var(--ink-500)",
              }}
            >
              {t("seller.dashboard.noSalesYet")}
            </div>
          )}
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: ".8125rem", color: "var(--ink-700)", fontWeight: 700 }}>
                    {k.label}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: ".7rem",
                    fontWeight: 800,
                    color: k.up ? "var(--success)" : "var(--danger)",
                    whiteSpace: "nowrap",
                    marginLeft: 8,
                  }}
                >
                  {k.delta}
                </span>
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--ink-900)",
                  marginBottom: 4,
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
                          fontWeight: 700,
                          color: "var(--ink-700)",
                        }}
                      >
                        <Icon name="truck" size={14} color="var(--blue)" />
                        {c.name}
                      </span>
                      <span
                        className="tnum"
                        style={{ fontSize: ".75rem", fontWeight: 800, color: "var(--ink-900)" }}
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
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 26,
              boxShadow: "var(--sh-1)",
            }}
          >
            <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", fontWeight: 600 }}>
              {range === "today" ? "Earnings today" : `Earnings · ${rangeLabel}`}
            </div>
            <div
              className="tnum bz-stat-xl"
              style={{
                fontWeight: 800,
                margin: "6px 0 4px",
                letterSpacing: "-.02em",
                color: "var(--blue-deep)",
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
              <Icon name="wallet" size={14} color="var(--success)" /> From your dashboard
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
                { k: "Orders", v: String(ordersPlaced) },
                { k: "To pack", v: String(kpis[1]?.value ?? "0") },
                { k: "Returns", v: "0" },
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
                    style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--ink-900)" }}
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
              border: "1.5px solid var(--line-200)",
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
              <div style={{ fontWeight: 800, fontSize: ".9375rem", color: "var(--blue-deep)" }}>
                Today's tasks
              </div>
              {tasks.length > 0 ? (
                <Chip tone="red" size="sm">
                  {tasks.length} to do
                </Chip>
              ) : (
                <Chip size="sm">All clear</Chip>
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
                No pending tasks. You are up to date.
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
                  <Icon name={t.icon} size={20} color={TINTS[t.tint as keyof typeof TINTS][2]} />
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
                  <div style={{ fontWeight: 700, fontSize: ".875rem" }}>{t.label}</div>
                </div>
                {t.action ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      t.action.onAct();
                    }}
                    style={{
                      position: "relative",
                      zIndex: 2,
                      flexShrink: 0,
                      height: 32,
                      padding: "0 12px",
                      background: t.urgent ? "var(--red)" : "#fff",
                      color: t.urgent ? "#fff" : "var(--blue)",
                      border: t.urgent ? "1.5px solid var(--red)" : "1.5px solid var(--blue)",
                      borderRadius: "var(--r-md)",
                      fontWeight: 800,
                      fontSize: ".75rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.action.label}
                  </button>
                ) : (
                  <Icon name="chevronRight" size={18} color="var(--ink-400)" />
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
              border: "1.5px solid var(--line-200)",
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
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                  }}
                >
                  Sales trend
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontSize: ".75rem",
                  fontWeight: 700,
                  color: "var(--ink-500)",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{ width: 10, height: 10, borderRadius: 2, background: "var(--blue)" }}
                  />
                  Sales
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{ width: 10, height: 10, borderRadius: 2, background: "var(--red)" }}
                  />
                  Today
                </span>
              </div>
            </div>
            <SellerBarChart
              data={salesByDay}
              height={200}
              summaryTotalLabel={
                range === "today"
                  ? "Today's total"
                  : range === "month"
                    ? "30-day total"
                    : "7-day total"
              }
            />
          </div>

          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
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
              <h3
                style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}
              >
                Bargaining
              </h3>
              <Button
                variant="ghost"
                size="sm"
                href={pathFromScreen("s-bargain")}
                iconRight="chevronRight"
              >
                Open
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
                <Icon name="bargain" size={22} color="var(--red)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: "var(--red)", fontSize: ".875rem" }}>
                    {bargainGlance.pending} offer waiting
                  </div>
                </div>
                <Icon name="chevronRight" size={18} color="var(--red)" />
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
                    style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--success)" }}
                  >
                    {bargainGlance.accepted}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Accepted today</div>
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
                    style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--saffron)" }}
                  >
                    {bargainGlance.avgGiven}%
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>Avg discount</div>
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
                    style={{ fontWeight: 800, fontSize: "1rem", color: "var(--ink-900)" }}
                  >
                    Rs. {bargainGlance.marginGiven.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    Margin given via bargain (this week)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 22,
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              margin: "0 0 14px",
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--blue-deep)",
            }}
          >
            Recent activity
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {activity.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < activity.length - 1 ? "1px dashed var(--line-200)" : "none",
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--line-100)",
                    color: a.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={a.icon} size={16} color={a.color} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".875rem", color: "var(--ink-900)", lineHeight: 1.4 }}>
                    {a.text}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--ink-400)", marginTop: 2 }}>
                    {a.t}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products table */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 22,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>
              Top products
            </h3>
            <Button
              variant="ghost"
              size="sm"
              href={pathFromScreen("s-products")}
              iconRight="chevronRight"
            >
              See all
            </Button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--line-200)" }}>
                {["Product", "Units sold", "Revenue", "Trend"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 8px",
                      textAlign: "left",
                      fontSize: ".7rem",
                      fontWeight: 700,
                      color: "var(--ink-500)",
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name} style={{ borderBottom: "1px dashed var(--line-200)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Placeholder
                        icon={p.icon}
                        tint={p.tint}
                        style={{ width: 40, height: 40 }}
                        radius="var(--r-sm)"
                      />
                      <span style={{ fontWeight: 700, fontSize: ".875rem" }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="tnum" style={{ padding: "12px 8px", fontWeight: 700 }}>
                    {p.units}
                  </td>
                  <td
                    className="tnum"
                    style={{ padding: "12px 8px", fontWeight: 800, color: "var(--success)" }}
                  >
                    Rs. {p.rev.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "12px 8px", width: 120 }}>
                    <SellerSparkline data={p.spark ?? []} color="var(--blue)" height={24} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                border: "1.5px solid var(--line-200)",
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
                <Icon name={a.icon} size={22} color={TINTS[a.tint as keyof typeof TINTS][2]} />
              </span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 800, fontSize: ".9375rem" }}>{a.label}</div>
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
                    fontWeight: 800,
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

        {/* Trust strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            padding: 18,
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
          }}
        >
          {trustStrip.map((s) => (
            <div key={s.k} style={{ textAlign: "center" }}>
              <div className="tnum" style={{ fontWeight: 800, fontSize: "1.5rem", color: s.c }}>
                {s.v}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.3 Orders Inbox (Viber-style feed) ---------- */
export const INBOX_TONE: Record<OrderStatus, string> = {
  placed: "red",
  accepted: "blue",
  packaging_started: "saffron",
  ready_for_pickup: "saffron",
  picked_up: "blue",
  arrived_at_hub: "blue",
  out_for_delivery: "blue",
  delivered: "success",
  cancelled: "neutral",
};
export const INBOX_LABEL: Record<OrderStatus, { en: string; icon: string }> = {
  placed: { en: "New order", icon: "package" },
  accepted: { en: "Accepted", icon: "check" },
  packaging_started: { en: "Packaging", icon: "package" },
  ready_for_pickup: { en: "Ready pickup", icon: "package" },
  picked_up: { en: "Picked up", icon: "truck" },
  arrived_at_hub: { en: "At hub", icon: "mapPin" },
  out_for_delivery: { en: "Out delivery", icon: "truck" },
  delivered: { en: "Delivered", icon: "check" },
  cancelled: { en: "Cancelled", icon: "x" },
};

export function OrderCard({
  o,
  onOpen,
}: {
  o: SellerInboxOrderItem;
  onOpen: (order: SellerInboxOrderItem) => void;
}) {
  const lbl = INBOX_LABEL[o.status];
  const tone = INBOX_TONE[o.status];
  return (
    <button
      onClick={() => onOpen(o)}
      style={{
        background: "#fff",
        border: `1.5px solid ${o.status === "placed" ? "var(--danger)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        display: "flex",
        gap: 10,
      }}
    >
      <BuyerAvatar
        src={o.buyerAvatarUrl}
        name={o.buyer}
        size={56}
        fontSize="1.25rem"
        style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Chip tone={tone} size="sm" icon={lbl.icon}>
            {lbl.en}
          </Chip>
          <span style={{ fontSize: ".68rem", color: "var(--ink-400)", marginLeft: "auto" }}>
            {o.time}
          </span>
        </div>
        <div
          style={{
            fontWeight: 800,
            color: "var(--ink-900)",
            fontSize: ".875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {o.buyer}
        </div>
        <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 1 }}>
          {o.city} · {o.item.slice(0, 30)}
        </div>
        <div
          className="tnum"
          style={{ fontSize: ".875rem", color: "var(--blue-deep)", fontWeight: 800, marginTop: 4 }}
        >
          Rs. {o.price.toLocaleString("en-IN")}
        </div>
      </div>
    </button>
  );
}

export const INBOX_DATE_RANGES = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

export function inDateRange(o: { time: string }, range: string) {
  if (range === "all") return true;
  // Time strings in mock data: "2 min ago", "1 hr ago", "3 hr ago", "yesterday", "2 days ago".
  const t = o.time.toLowerCase();
  const isToday = t.includes("min") || t.includes("hr");
  const isThisWeek = isToday || t.includes("yesterday") || /^[1-6] days?/.test(t);
  if (range === "today") return isToday;
  if (range === "7d") return isThisWeek;
  return true; // 30d catches everything in mock
}

export function SellerInbox() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const { data: INBOX_ORDERS = [], isLoading, isError, error } = useSellerInbox();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("list"); // list | kanban
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");

  const q = search.trim().toLowerCase();
  const baseFiltered = INBOX_ORDERS.filter((o: SellerInboxOrderItem) => {
    if (q && !`${o.id} ${o.buyer} ${o.city} ${o.item}`.toLowerCase().includes(q)) return false;
    if (!inDateRange(o, range)) return false;
    return true;
  });
  const counts = {
    all: baseFiltered.length,
    placed: baseFiltered.filter((o) => o.status === "placed").length,
    processing: baseFiltered.filter((o) =>
      ["accepted", "packaging_started", "ready_for_pickup"].includes(o.status),
    ).length,
    shipped: baseFiltered.filter((o) =>
      ["picked_up", "arrived_at_hub", "out_for_delivery"].includes(o.status),
    ).length,
    completed: baseFiltered.filter((o) => o.status === "delivered").length,
    cancelled: baseFiltered.filter((o) => o.status === "cancelled").length,
  };
  const list = baseFiltered.filter((o) => {
    if (tab === "all") return true;
    if (tab === "processing")
      return ["accepted", "packaging_started", "ready_for_pickup"].includes(o.status);
    if (tab === "shipped")
      return ["picked_up", "arrived_at_hub", "out_for_delivery"].includes(o.status);
    if (tab === "completed") return o.status === "delivered";
    return o.status === tab;
  });
  const openOrder = (o: SellerInboxOrderItem) => {
    sellerOrderRef.current = o;
    nav("s-order-detail");
  };
  const filtersActive = search.trim() || range !== "all" || tab !== "all";
  const clearFilters = () => {
    setSearch("");
    setRange("all");
    setTab("all");
  };
  const ordersPaged = usePages(list, 8, `${tab}|${q}|${range}`);

  const tabs = [
    { id: "all", label: t("seller.inbox.tabAll") },
    { id: "placed", label: t("seller.inbox.tabNew") },
    { id: "processing", label: t("seller.inbox.tabProcessing") },
    { id: "shipped", label: t("seller.inbox.tabShipped") },
    { id: "completed", label: t("seller.inbox.tabCompleted") },
    { id: "cancelled", label: t("seller.inbox.tabCancelled") },
  ];

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <SellerHelpBar />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}
            >
              {t("seller.inbox.title")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
              {t("seller.inbox.subtitle")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setView((v) => (v === "list" ? "kanban" : "list"))}
              className="bz-mobile-hide"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontWeight: 700,
                fontSize: ".8125rem",
                cursor: "pointer",
                color: "var(--ink-700)",
              }}
            >
              <Icon name={view === "list" ? "kanban" : "layout"} size={16} />
              {view === "list" ? "Board view" : "List view"}
            </button>
          </div>
        </div>

        {/* Search + date range */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 240px", position: "relative", minWidth: 200 }}>
            <Icon
              name="search"
              size={16}
              color="var(--ink-400)"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID, buyer, or item"
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                height: 40,
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontSize: ".875rem",
                background: "#fff",
                color: "var(--ink-900)",
                outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 24,
                  height: 24,
                  borderRadius: "var(--r-full)",
                  border: "none",
                  background: "var(--line-200)",
                  color: "var(--ink-700)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={12} color="var(--ink-700)" />
              </button>
            )}
          </div>
          <div
            style={{
              display: "inline-flex",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-full)",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {INBOX_DATE_RANGES.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                aria-pressed={range === r.id}
                style={{
                  padding: "8px 14px",
                  minHeight: 40,
                  border: "none",
                  cursor: "pointer",
                  background: range === r.id ? "var(--blue-deep)" : "transparent",
                  color: range === r.id ? "#fff" : "var(--ink-700)",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  whiteSpace: "nowrap",
                  borderLeft: i === 0 ? "none" : "1px solid var(--line-200)",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          {filtersActive && (
            <button
              onClick={clearFilters}
              style={{
                height: 40,
                padding: "0 14px",
                border: "none",
                background: "none",
                color: "var(--ink-500)",
                fontWeight: 700,
                fontSize: ".8125rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Status pills */}
        <div style={{ marginBottom: 16 }}>
          <ChipGroup
            options={tabs.map((t) => ({
              value: t.id,
              label: `${t.label} (${counts[t.id as keyof typeof counts]})`,
            }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {view === "kanban" ? (
          <div className="bz-kanban">
            {[
              { id: "placed", statuses: ["placed"] },
              { id: "processing", statuses: ["accepted", "packaging_started", "ready_for_pickup"] },
              { id: "shipped", statuses: ["picked_up", "arrived_at_hub", "out_for_delivery"] },
              { id: "completed", statuses: ["delivered"] },
            ].map((col) => {
              const sampleStatus = col.statuses[0] as OrderStatus;
              const lbl =
                col.id === "processing"
                  ? { en: "Processing", icon: "package" }
                  : col.id === "shipped"
                    ? { en: "Shipped", icon: "truck" }
                    : INBOX_LABEL[sampleStatus];
              const tone = INBOX_TONE[sampleStatus];
              const items = baseFiltered.filter((o) => col.statuses.includes(o.status));
              return (
                <div
                  key={col.id}
                  style={{
                    background: "var(--line-100)",
                    borderRadius: "var(--r-lg)",
                    padding: 10,
                    minHeight: 200,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 6px 10px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 800,
                        fontSize: ".875rem",
                        color: "var(--ink-900)",
                      }}
                    >
                      <Icon
                        name={lbl.icon}
                        size={16}
                        color={`var(--${tone === "success" ? "success" : tone})`}
                      />
                      {lbl.en}
                    </span>
                    <span
                      className="tnum"
                      style={{
                        background: "#fff",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: ".7rem",
                        fontWeight: 800,
                      }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.length === 0 && (
                      <div
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: "var(--ink-400)",
                          fontSize: ".8125rem",
                        }}
                      >
                        None
                      </div>
                    )}
                    {items.map((o) => (
                      <OrderCard key={o.id} o={o} onOpen={openOrder} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 20px",
                    color: "var(--ink-500)",
                  }}
                >
                  <Icon name="package" size={48} color="var(--ink-300)" />
                  <p style={{ marginTop: 12, fontWeight: 600 }}>No orders here yet</p>
                </div>
              )}
              {ordersPaged.visible.map((o) => (
                <OrderCard key={o.id} o={o} onOpen={openOrder} />
              ))}
            </div>
            {list.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <PageBar
                  page={ordersPaged.page}
                  pageCount={ordersPaged.pageCount}
                  onPage={ordersPaged.goPage}
                  alwaysShow
                />
                <div
                  className="tnum"
                  style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}
                >
                  Showing {ordersPaged.from}–{ordersPaged.to} of {ordersPaged.total} orders
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ApiState>
  );
}

/* ---------- 4.3b Order detail — full-screen, one big action ---------- */
export function SellerOrderDetail() {
  const { nav, toast } = useBz();
  const { data: inboxOrders = [] } = useSellerInbox();
  const o = sellerOrderRef.current || inboxOrders[0];
  const updateStatus = useUpdateSellerOrderStatus();

  if (!o) {
    return (
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <EmptyState
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
    if (window.confirm("Cancel this order before pickup?")) {
      void moveOrder("cancelled");
    }
  };

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <SellerHelpBar />

        <AppLink
          href={pathFromScreen("s-inbox")}
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
          <Icon name="chevronLeft" size={16} /> Back to orders
        </AppLink>

        <div
          style={{
            background: "linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)",
            border: "2px solid var(--danger)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Icon name="package" size={32} color="var(--danger)" />
          <div>
            <div style={{ fontWeight: 800, color: "var(--danger)", fontSize: "1rem" }}>
              {INBOX_LABEL[o.status].en}
            </div>
            <div style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>
              {o.time} · Order #{o.id}
            </div>
          </div>
        </div>

        {/* Buyer */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 700,
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
              <div style={{ fontWeight: 800, fontSize: "1.0625rem" }}>{o.buyer}</div>
              <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>{o.city}</div>
            </div>
            <a
              href={`tel:${o.phone}`}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#16a34a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <Icon name="phone" size={22} color="#fff" />
            </a>
          </div>
        </div>

        {/* Item */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 700,
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
              <div style={{ fontWeight: 700 }}>{o.item}</div>
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
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--ink-400)",
              fontWeight: 700,
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
              style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--blue-deep)" }}
            >
              Rs. {o.price.toLocaleString("en-IN")}
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
            <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>You get</span>
            <span
              className="tnum"
              style={{ fontWeight: 800, fontSize: "1.375rem", color: "var(--success)" }}
            >
              Rs. {o.price.toLocaleString("en-IN")}
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
              color: "var(--blue-deep)",
              fontWeight: 700,
            }}
          >
            <Icon name="check" size={18} /> Accepted — waiting for other sellers to confirm
          </div>
        ) : nextStatus[o.status] ? (
          <Button
            variant="primary"
            size="lg"
            full
            loading={updateStatus.isPending}
            onClick={() => void moveOrder(nextStatus[o.status]!)}
            icon="check"
          >
            {nextLabel[o.status]}
          </Button>
        ) : (
          <Button variant="ghost" size="lg" full disabled>
            {INBOX_LABEL[o.status].en}
          </Button>
        )}
        {o.canCancel && (
          <Button
            variant="danger"
            full
            disabled={updateStatus.isPending}
            onClick={reject}
            style={{ marginTop: 10 }}
          >
            Can't fulfill
          </Button>
        )}
      </div>
    </div>
  );
}

const RESERVED_METADATA_KEYS = new Set(["stock"]);

function labelFromMetadataKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function keyFromMetadataLabel(label: string) {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  const [first, ...rest] = words;
  return [
    (first ?? "").toLowerCase(),
    ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()),
  ].join("");
}

function uniqueMetadataKey(label: string, existing: Set<string>, current?: string) {
  const base = keyFromMetadataLabel(label);
  if (!base) return "";
  if (base === current || !existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}${i}`) && `${base}${i}` !== current) i += 1;
  return `${base}${i}`;
}

function cleanMetadata(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(([key, value]) => {
      if (RESERVED_METADATA_KEYS.has(key)) return false;
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
}

/* ---------- 4.4a Product metadata fields ---------- */
export function CategoryAttrFields({
  category,
  values,
  onChange,
}: {
  category: string;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const { data: categories = [] } = useCategories();
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [newMetaLabel, setNewMetaLabel] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");
  // Optional fields the seller has chosen to add (revealed from a suggestion chip)
  // but may not have filled yet. We can't lean on `values` for this because
  // cleanMetadata() drops empty entries, so an added-but-blank field would vanish.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  // Whether the "Custom detail" add row is showing.
  const [showCustom, setShowCustom] = useState(false);
  const cat = categories.find((c) => c.id === category);
  const fields = cat?.fields || [];
  const fieldKeys = new Set(fields.map((field) => field.k));
  const customKeys = Object.keys(values).filter(
    (key) => !fieldKeys.has(key) && !RESERVED_METADATA_KEYS.has(key),
  );
  // Required fields and anything already filled or explicitly opened show as rows;
  // everything else stays tucked behind a suggestion chip (progressive disclosure).
  const isShown = (f: CategoryAttributeField) =>
    f.req === true || values[f.k] !== undefined || opened.has(f.k);
  const shownFields = fields.filter(isShown);
  const chipFields = fields.filter((f) => !isShown(f));
  // Reset reveal state when the seller switches category — the old keys no longer
  // map to this category's fields.
  useEffect(() => {
    setOpened(new Set());
    setShowCustom(false);
  }, [category]);
  const inputStyle = {
    width: "100%",
    height: 48,
    fontSize: ".9375rem",
    border: "1.5px solid var(--line-200)",
    borderRadius: "var(--r-md)",
    padding: "0 14px",
    outline: "none",
    background: "#fff",
    fontFamily: "var(--font-sans)",
    color: "var(--ink-900)",
  };
  const buttonStyle = {
    minHeight: 40,
    padding: "0 12px",
    borderRadius: "var(--r-md)",
    border: "1.5px solid var(--line-200)",
    background: "#fff",
    color: "var(--ink-600)",
    fontWeight: 700,
    cursor: "pointer",
  };
  // Borderless control that lives inside a spec row (the row itself carries the
  // border + focus ring), so the input reads as plain text next to its label.
  const cellInput = {
    width: "100%",
    minWidth: 0,
    height: 40,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: 0,
    fontFamily: "var(--font-sans)",
    fontSize: ".9375rem",
    color: "var(--ink-900)",
  };
  const set = (k: string, v: unknown) => onChange(cleanMetadata({ ...values, [k]: v }));
  const remove = (k: string) => {
    const next = { ...values };
    delete next[k];
    onChange(cleanMetadata(next));
  };
  // Reveal an optional field as an editable row (from its suggestion chip).
  const openField = (k: string) => setOpened((prev) => new Set(prev).add(k));
  // Send an optional field back to the suggestion row: clear its value and reveal.
  const removeField = (k: string) => {
    setOpened((prev) => {
      const next = new Set(prev);
      next.delete(k);
      return next;
    });
    remove(k);
  };
  const toggleMulti = (k: string, opt: string) => {
    const cur = Array.isArray(values[k]) ? values[k] : [];
    set(k, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };
  const addOther = (k: string) => {
    const raw = (otherText[k] || "").trim();
    if (!raw) return;
    const cur = Array.isArray(values[k]) ? (values[k] as string[]) : [];
    if (!cur.some((x) => x.toLowerCase() === raw.toLowerCase())) set(k, [...cur, raw]);
    setOtherText((t) => ({ ...t, [k]: "" }));
  };
  const commitCustomLabel = (oldKey: string) => {
    const label = (customLabels[oldKey] ?? labelFromMetadataKey(oldKey)).trim();
    const existing = new Set(Object.keys(values));
    const nextKey = uniqueMetadataKey(label, existing, oldKey);
    if (!nextKey || nextKey === oldKey) return;
    const next = { ...values, [nextKey]: values[oldKey] };
    delete next[oldKey];
    onChange(cleanMetadata(next));
    setCustomLabels((labels) => {
      const copy = { ...labels };
      delete copy[oldKey];
      copy[nextKey] = label;
      return copy;
    });
  };
  const addCustom = () => {
    const label = newMetaLabel.trim();
    const value = newMetaValue.trim();
    if (!label || !value) return;
    const key = uniqueMetadataKey(label, new Set(Object.keys(values)));
    if (!key) return;
    onChange(cleanMetadata({ ...values, [key]: value }));
    setCustomLabels((labels) => ({ ...labels, [key]: label }));
    setNewMetaLabel("");
    setNewMetaValue("");
    setShowCustom(false);
  };
  const cancelCustom = () => {
    setNewMetaLabel("");
    setNewMetaValue("");
    setShowCustom(false);
  };
  // A field's editable control, sized to sit borderless inside a spec row.
  const renderControl = (f: CategoryAttributeField) => {
    if (f.t === "select") {
      return (
        <select
          value={(values[f.k] as string | number | undefined) || ""}
          onChange={(e) => set(f.k, e.target.value)}
          aria-label={f.en}
          style={{
            ...cellInput,
            cursor: "pointer",
            color: values[f.k] ? "var(--ink-900)" : "var(--ink-400)",
            fontWeight: values[f.k] ? 600 : 400,
          }}
        >
          <option value="">Choose…</option>
          {(f.o ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    if (f.t === "multi") {
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ...(f.o ?? []),
            ...((Array.isArray(values[f.k]) ? values[f.k] : []) as string[]).filter(
              (v) => !(f.o ?? []).includes(v),
            ),
          ].map((o) => {
            const selected = Array.isArray(values[f.k]) ? (values[f.k] as string[]) : [];
            const on = selected.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleMulti(f.k, o)}
                aria-pressed={on}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--r-full)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  minHeight: 40,
                  border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
                  background: on ? "var(--tint-blue-50)" : "#fff",
                  color: on ? "var(--blue)" : "var(--ink-500)",
                }}
              >
                {on ? "✓ " : ""}
                {o}
              </button>
            );
          })}
          {f.allowOther && (
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input
                value={otherText[f.k] || ""}
                onChange={(e) => setOtherText((t) => ({ ...t, [f.k]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOther(f.k);
                  }
                }}
                placeholder="Other…"
                style={{
                  width: 120,
                  minHeight: 40,
                  padding: "0 12px",
                  borderRadius: "var(--r-full)",
                  border: "1.5px dashed var(--line-200)",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: ".8125rem",
                  color: "var(--ink-900)",
                }}
              />
              <button
                type="button"
                onClick={() => addOther(f.k)}
                disabled={!(otherText[f.k] || "").trim()}
                style={{
                  minHeight: 40,
                  padding: "0 14px",
                  borderRadius: "var(--r-full)",
                  border: "1.5px solid var(--blue)",
                  background: "#fff",
                  color: "var(--blue)",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  cursor: (otherText[f.k] || "").trim() ? "pointer" : "default",
                  opacity: (otherText[f.k] || "").trim() ? 1 : 0.4,
                }}
              >
                + Add
              </button>
            </span>
          )}
        </div>
      );
    }
    if (f.t === "date") {
      return (
        <input
          type="date"
          value={(values[f.k] as string | number | undefined) || ""}
          onChange={(e) => set(f.k, e.target.value)}
          aria-label={f.en}
          style={cellInput}
        />
      );
    }
    if (f.t === "toggle") {
      const on = !!values[f.k];
      return (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={f.en}
          onClick={() => set(f.k, !on)}
          style={{
            width: 46,
            height: 28,
            flexShrink: 0,
            justifySelf: "start",
            borderRadius: "var(--r-full)",
            border: "none",
            cursor: "pointer",
            padding: 3,
            background: on ? "var(--blue)" : "var(--line-200)",
            display: "inline-flex",
            justifyContent: on ? "flex-end" : "flex-start",
            transition: "background var(--dur-standard) var(--ease)",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              display: "block",
              boxShadow: "0 1px 2px rgba(0,0,0,.2)",
            }}
          />
        </button>
      );
    }
    // text / num
    return (
      <input
        value={(values[f.k] as string | number | undefined) || ""}
        inputMode={f.t === "num" ? "numeric" : undefined}
        onChange={(e) =>
          set(f.k, f.t === "num" ? e.target.value.replace(/\D/g, "") : e.target.value)
        }
        placeholder="Type here"
        aria-label={f.en}
        style={cellInput}
      />
    );
  };

  const showCustomChip = !showCustom;
  const showSuggestions = chipFields.length > 0 || showCustomChip;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Added rows — required fields always, plus anything the seller filled or opened */}
      {shownFields.map((f) => (
        <div className="bz-spec-row" key={f.k}>
          <div className="bz-spec-row__label">
            {f.en}
            {f.u && <span className="bz-spec-row__unit">({f.u})</span>}
            {f.req && <span className="bz-spec-row__req">Required</span>}
          </div>
          <div className="bz-spec-row__control">{renderControl(f)}</div>
          {!f.req && (
            <button
              type="button"
              onClick={() => removeField(f.k)}
              className="bz-spec-row__remove"
              aria-label={`Remove ${f.en}`}
            >
              <Icon name="x" size={16} />
            </button>
          )}
          {f.help && <p className="bz-spec-row__help">{f.help}</p>}
        </div>
      ))}

      {/* Custom details the seller already added — label is editable */}
      {customKeys.map((key) => (
        <div key={key} className="bz-spec-row">
          <input
            value={customLabels[key] ?? labelFromMetadataKey(key)}
            onChange={(e) => setCustomLabels((labels) => ({ ...labels, [key]: e.target.value }))}
            onBlur={() => commitCustomLabel(key)}
            className="bz-spec-row__label"
            style={cellInput}
            aria-label="Detail name"
          />
          <input
            value={String(values[key] ?? "")}
            onChange={(e) => set(key, e.target.value)}
            className="bz-spec-row__control"
            style={cellInput}
            aria-label="Detail value"
          />
          <button
            type="button"
            onClick={() => remove(key)}
            className="bz-spec-row__remove"
            aria-label="Remove custom detail"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}

      {/* Inline custom-detail editor (opened from the dashed chip) */}
      {showCustom && (
        <div className="bz-metadata-row">
          <input
            value={newMetaLabel}
            onChange={(e) => setNewMetaLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelCustom();
            }}
            placeholder="Detail name (e.g. Fabric origin)"
            style={inputStyle}
            aria-label="Custom detail name"
            autoFocus
          />
          <input
            value={newMetaValue}
            onChange={(e) => setNewMetaValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
              if (e.key === "Escape") cancelCustom();
            }}
            placeholder="Value"
            style={inputStyle}
            aria-label="Custom detail value"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={addCustom}
              disabled={!newMetaLabel.trim() || !newMetaValue.trim()}
              style={{
                ...buttonStyle,
                borderColor: "var(--blue)",
                color: "var(--blue)",
                opacity: newMetaLabel.trim() && newMetaValue.trim() ? 1 : 0.45,
              }}
            >
              Add
            </button>
            <button type="button" onClick={cancelCustom} style={buttonStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Suggestion chips — tap to reveal a row; added ones drop out of this list */}
      {showSuggestions && (
        <div style={{ marginTop: shownFields.length || customKeys.length ? 4 : 0 }}>
          <div
            style={{
              fontSize: ".6875rem",
              fontWeight: 800,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "var(--ink-400)",
              marginBottom: 10,
            }}
          >
            Suggested for {cat?.en ?? "this product"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {chipFields.map((f) => (
              <button
                key={f.k}
                type="button"
                onClick={() => openField(f.k)}
                style={{
                  minHeight: 40,
                  padding: "0 16px",
                  borderRadius: "var(--r-full)",
                  border: "1.5px solid var(--line-200)",
                  background: "#fff",
                  color: "var(--ink-700)",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  cursor: "pointer",
                }}
              >
                {f.en}
              </button>
            ))}
            {showCustomChip && (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                style={{
                  minHeight: 40,
                  padding: "0 16px",
                  borderRadius: "var(--r-full)",
                  border: "1.5px dashed var(--blue)",
                  background: "transparent",
                  color: "var(--blue)",
                  fontWeight: 700,
                  fontSize: ".875rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="edit" size={15} color="var(--blue)" />
                Custom detail
              </button>
            )}
          </div>
        </div>
      )}

      <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-400)" }}>
        Tap any chip to add it. Done? Just keep scrolling — this section is optional.
      </p>
    </div>
  );
}

// Has the seller filled an attribute field? (multi=any selected, toggle=true, else non-empty)
export const attrFilled = (f: { t: string }, v: unknown) => {
  if (f.t === "multi") return Array.isArray(v) && v.length > 0;
  if (f.t === "toggle") return v === true;
  return !!v && (typeof v !== "string" || v.trim() !== "");
};

/* ---------- 4.4 Add / Edit Product — Three-Tap Listing ---------- */
// One form for both create and edit. In edit mode (`editing` set, threaded via
// `editProductRef`) the screen prefills from the existing product, locks the
// category (recategorizing is unsupported), and PATCHes instead of POSTing.
// Photos are editable in both modes; existing ones are seeded as remote entries
// so unchanged images are reused rather than re-uploaded.

// Seeds the photo picker from images already hosted on the CDN. `remoteUrl`
// marks them as upload-free; sourceName (from the URL) keeps duplicate
// detection working against newly added files.
function remotePhotoFromUrl(url: string, index: number): ProductPhoto {
  return {
    id: `existing-${index}-${url}`,
    previewUrl: url,
    remoteUrl: url,
    sourceName: url.split("/").pop()?.split("?")[0] || `photo-${index + 1}`,
  };
}

export function SellerAddProduct({
  editing = null,
}: { editing?: SellerInventoryItem | null } = {}) {
  const { t } = useTranslation();
  const isEdit = Boolean(editing);
  const { nav, toast } = useBz();
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const vStatus = verification?.status ?? "none";
  const canSell = verification?.canSell === true;
  const { data: categories = [] } = useCategories();
  const uploadImage = useUploadImage();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  // Full product (description, category, specs) — only fetched when editing.
  const {
    data: editingProduct,
    isLoading: editingLoading,
    isError: editingError,
    error: editingErr,
  } = useProduct(isEdit ? (editing?.id ?? null) : null);
  const [productPhotos, setProductPhotos] = useState<ProductPhoto[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<
    Array<{
      id: string | number;
      name: string;
      price: string;
      stock: string;
      onSale?: boolean;
      saleMode?: "amount" | "percent";
      salePrice?: string;
      salePct?: string;
      allowBargaining?: boolean;
      minimumPrice?: string;
    }>
  >([
    { id: 1, name: "Small", price: "", stock: "" },
    { id: 2, name: "Medium", price: "", stock: "" },
    { id: 3, name: "Large", price: "", stock: "" },
  ]);
  const [bargainOk, setBargainOk] = useState(true);
  const [bargainMinPrice, setBargainMinPrice] = useState("");
  // Discount (single-price products only). `price` above holds the regular
  // price; on sale it becomes the struck-through `original` and the effective
  // price is `salePrice` (amount mode) or computed from `salePct` (percent mode).
  const [onSale, setOnSale] = useState(false);
  const [saleMode, setSaleMode] = useState<"amount" | "percent">("percent");
  const [salePrice, setSalePrice] = useState("");
  const [salePct, setSalePct] = useState("");
  const [attrs, setAttrs] = useState<Record<string, unknown>>({});

  // Prefill once from the existing product when editing. The inventory row
  // (`editing`) carries the authoritative stock + variants; the fetched product
  // carries everything else. Strip a stray `stock` key out of metadata so it
  // can't shadow the real stock field the server tracks separately.
  const prefilled = useRef(false);
  useEffect(() => {
    if (!isEdit || prefilled.current || !editingProduct) return;
    prefilled.current = true;
    const existingImages = editingProduct.images?.length
      ? editingProduct.images
      : [editingProduct.img, ...(editing?.images ?? [])].filter(Boolean);
    setProductPhotos(existingImages.map((url, i) => remotePhotoFromUrl(url as string, i)));
    setTitle(editingProduct.name ?? "");
    setDescription(editingProduct.description ?? "");
    setCategory(editingProduct.cat ?? "");
    const meta = { ...((editingProduct.metadata as Record<string, unknown>) ?? {}) };
    delete meta.stock;
    setAttrs(meta);
    // Product-level bargaining settings come from the seller-only inventory row
    // (`editing`), not the public product — the floor is never sent to buyers.
    setBargainOk(editing?.allowBargaining ?? false);
    setBargainMinPrice(editing?.minimumPrice ? String(editing.minimumPrice) : "");
    if (editing?.hasVariants && editing.variants?.length) {
      setHasVariants(true);
      setVariants(
        editing.variants.map((v) => {
          // On sale: `price` is effective and `original` the base; the Price
          // field shows the base, and the sale inputs hold the discount.
          const onSale = Boolean(v.discountType && v.original);
          return {
            id: v.id,
            name: v.name,
            price: String(onSale ? v.original : v.price),
            stock: String(v.stock),
            onSale,
            saleMode: v.discountType === "amount" ? "amount" : "percent",
            salePrice: v.discountType === "amount" ? String(v.price) : "",
            salePct: v.discountType === "percent" ? String(v.discountPct ?? "") : "",
            allowBargaining: v.allowBargaining ?? false,
            minimumPrice: v.minimumPrice ? String(v.minimumPrice) : "",
          };
        }),
      );
    } else {
      setHasVariants(false);
      // When on sale, `price` (effective) and `original` (base) are stored
      // separately; the Price field always shows the regular (base) price.
      const dType = editingProduct.discountType ?? null;
      if (dType && editingProduct.original) {
        setOnSale(true);
        setPrice(String(editingProduct.original));
        if (dType === "percent") {
          setSaleMode("percent");
          setSalePct(editingProduct.discountPct ? String(editingProduct.discountPct) : "");
        } else {
          setSaleMode("amount");
          setSalePrice(String(editingProduct.price));
        }
      } else {
        setPrice(String(editingProduct.price ?? editing?.price ?? ""));
      }
      setStock(String(editing?.stock ?? ""));
    }
  }, [isEdit, editingProduct, editing]);

  // New category → start its attributes fresh (never carry the wrong category's fields).
  const pickCategory = (id: string) => {
    setCategory(id);
    setAttrs({});
  };

  const attrFields = categories.find((c) => c.id === category)?.fields || [];

  const titleOk = title.trim().length >= 3;
  const descriptionOk = description.trim().length >= 10;
  const categoryOk = Boolean(category);
  const specsOk = true;
  // Sale input for a variant row (the variant's Price field is its regular price).
  const variantSaleInput = (v: {
    price: string;
    saleMode?: string;
    salePrice?: string;
    salePct?: string;
  }) => ({
    base: Number(v.price) || 0,
    mode: (v.saleMode ?? "percent") as "amount" | "percent",
    salePrice: Number(v.salePrice) || 0,
    salePct: Number(v.salePct) || 0,
  });
  const variantsOk =
    !hasVariants ||
    variants.every((v) => v.price && v.stock && (!v.onSale || isSaleValid(variantSaleInput(v))));
  // Same 3–5 rule for new listings and edits — an edit can swap photos but must
  // still end with a valid gallery.
  const photosOk = productPhotos.length >= 3 && productPhotos.length <= 5;

  // Discount (single-price only). Pure math lives in @/lib/discount and mirrors
  // the server's authoritative rules so the seller gets immediate feedback.
  const applyDiscount = onSale && !hasVariants;
  const baseNum = Number(price) || 0;
  const saleInput = {
    base: baseNum,
    mode: saleMode,
    salePrice: Number(salePrice) || 0,
    salePct: Number(salePct) || 0,
  };
  const saleEffectivePrice = saleEffective(saleInput);
  const saleValid = !applyDiscount || isSaleValid(saleInput);

  // Bargaining needs a floor below the listed (effective) price, or it's enabled
  // but no offer could be accepted. Mirrors the server rule so the seller gets
  // the feedback before submitting. Checked per variant for variant products.
  const productListedPrice = applyDiscount ? saleEffectivePrice : baseNum;
  // The listed (effective) price a variant's floor must stay below.
  const variantListedPrice = (v: {
    price: string;
    onSale?: boolean;
    saleMode?: string;
    salePrice?: string;
    salePct?: string;
  }) => (v.onSale ? saleEffective(variantSaleInput(v)) : Number(v.price) || 0);
  // Live, per-variant validation for the min-bargain-price field. Returns an
  // error string to show under the field, or null when the row is fine. Mirrors
  // the server rule: a whole number above 0 and strictly below the variant's
  // own listed price. Fires independently for each variant row.
  const variantFloorError = (v: {
    price: string;
    onSale?: boolean;
    saleMode?: string;
    salePrice?: string;
    salePct?: string;
    allowBargaining?: boolean;
    minimumPrice?: string;
  }): string | null => {
    if (!v.allowBargaining) return null;
    const raw = (v.minimumPrice ?? "").trim();
    if (raw === "") return "Enter a lowest price to enable bargaining";
    const floor = Number(raw);
    if (!Number.isInteger(floor) || floor <= 0) return "Enter a whole number above 0";
    const listed = variantListedPrice(v);
    if (listed > 0 && floor >= listed)
      return `Must be less than Rs. ${listed.toLocaleString("en-IN")}`;
    return null;
  };
  const bargainFloorOk = hasVariants
    ? variants.every((v) => variantFloorError(v) === null)
    : !bargainOk || (Number(bargainMinPrice) > 0 && Number(bargainMinPrice) < productListedPrice);

  const canPublish =
    photosOk &&
    titleOk &&
    descriptionOk &&
    specsOk &&
    categoryOk &&
    saleValid &&
    bargainFloorOk &&
    (hasVariants ? variantsOk : price && stock);

  const publishMissing: string[] = [];
  if (!photosOk) publishMissing.push("3 to 5 photos (required)");
  if (!titleOk) publishMissing.push("product name (3+ characters)");
  if (!descriptionOk) publishMissing.push("product description (10+ characters)");
  if (!category) publishMissing.push("category");
  if (hasVariants) {
    if (!variantsOk) publishMissing.push("price & stock on every variant");
  } else {
    if (!price) publishMissing.push("price (Rs.)");
    if (!stock) publishMissing.push("stock quantity");
  }
  if (!saleValid) {
    publishMissing.push(
      saleMode === "percent"
        ? "a discount percentage between 1 and 99"
        : "a discounted price below the regular price",
    );
  }
  if (!bargainFloorOk) {
    publishMissing.push("a lowest bargain price below the listed price (bargaining is on)");
  }
  const categoryMeta = categories.find((c) => c.id === category);
  const displayPrice = hasVariants ? variants.find((v) => v.price)?.price : price;
  const displayStock = hasVariants
    ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
    : stock;

  const updateVariant = (id: string | number, key: string, val: string | number | boolean) =>
    setVariants((arr) => arr.map((v) => (v.id === id ? { ...v, [key]: val } : v)));
  const addVariant = () =>
    setVariants((arr) => [
      ...arr,
      {
        id: Date.now(),
        name: "",
        price: "",
        stock: "",
        onSale: false,
        saleMode: "percent",
        salePrice: "",
        salePct: "",
        allowBargaining: false,
        minimumPrice: "",
      },
    ]);
  const removeVariant = (id: string | number) =>
    setVariants((arr) => arr.filter((v) => v.id !== id));

  // Pricing in the API's shape (price = effective/sale price, original = struck
  // base price). Variant products keep their existing product-level price and
  // carry no product-level discount in this phase. Shared by create and edit.
  const buildPricingPayload = () => {
    if (hasVariants) {
      return {
        price: Number(price || displayPrice || 0),
        original: null,
        discountType: null,
        discountPct: null,
      };
    }
    return buildPricing(applyDiscount, saleInput);
  };

  // Variants the seller actually filled, in the API's shape. Shared by create
  // and edit so both paths agree on what a "complete" variant is.
  const buildVariants = () =>
    hasVariants
      ? variants
          .filter((v) => v.name && v.price && v.stock)
          .map((v) => {
            const pricing = v.onSale
              ? buildPricing(true, variantSaleInput(v))
              : { price: Number(v.price), original: null, discountType: null, discountPct: null };
            return {
              id: String(v.id),
              name: v.name.trim(),
              stock: Number(v.stock),
              ...pricing,
              allowBargaining: v.allowBargaining ?? false,
              minimumPrice: v.allowBargaining && v.minimumPrice ? Number(v.minimumPrice) : null,
            };
          })
      : undefined;

  // Publish: upload every photo (3–5, cover first), then create the product.
  // Edit: upload any newly added photos, then PATCH the changed fields (category
  // is never sent). Postgres is the source of truth; the server re-indexes it
  // into search in the background.
  const publishing = uploadImage.isPending || createProduct.isPending || updateProduct.isPending;
  const handlePublish = async () => {
    if (!canPublish || publishing) return;
    if (isEdit && editing) {
      try {
        // Upload only the newly captured photos; reuse already-hosted ones by
        // their CDN URL so an edit that doesn't touch photos costs no uploads.
        const images = await Promise.all(
          productPhotos.map(async (photo) => {
            if (!photo.file) return photo.remoteUrl as string;
            const uploaded = await uploadImage.mutateAsync({ file: photo.file });
            return uploaded.url;
          }),
        );
        await updateProduct.mutateAsync({
          id: editing.id,
          name: title.trim(),
          description: description.trim(),
          ...buildPricingPayload(),
          images,
          metadata: attrs,
          stock: hasVariants ? undefined : Number(stock) || 0,
          variants: buildVariants(),
          allowBargaining: hasVariants ? variants.some((v) => v.allowBargaining) : bargainOk,
          minimumPrice: hasVariants
            ? null
            : bargainOk && bargainMinPrice
              ? Number(bargainMinPrice)
              : null,
        });
        toast("Product updated");
        nav("s-products");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not save changes. Please try again.");
      }
      return;
    }
    try {
      const uploaded = await Promise.all(
        productPhotos.map((photo) => uploadImage.mutateAsync({ file: photo.file! })),
      );
      const images = uploaded.map((u) => u.url);
      await createProduct.mutateAsync({
        name: title.trim(),
        description: description.trim(),
        ...buildPricingPayload(),
        categoryId: category,
        images,
        img: images[0],
        metadata: attrs,
        stock: hasVariants ? undefined : Number(stock) || 0,
        variants: buildVariants(),
        allowBargaining: hasVariants ? variants.some((v) => v.allowBargaining) : bargainOk,
        minimumPrice: hasVariants
          ? null
          : bargainOk && bargainMinPrice
            ? Number(bargainMinPrice)
            : null,
      });
      toast("Product published!");
      nav("s-products");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not publish. Please try again.");
    }
  };

  if (!canSell) {
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <SellerVerificationBlocked
          actionLabel="add products"
          status={vStatus}
          note={verification?.note}
          onAction={vStatus === "pending" ? undefined : () => nav("s-onboarding")}
        />
      </div>
    );
  }

  // Editing: wait for the product before showing the form, so fields don't flash
  // empty then fill in. If it can't be loaded, send the seller back with a note.
  if (isEdit && !editingProduct) {
    if (editingError) {
      return (
        <div className="bz-seller-page">
          <SellerHelpBar />
          <EmptyState
            title="Couldn't load this product"
            message={
              editingErr instanceof Error
                ? editingErr.message
                : "It may have been removed. Go back to your products and try again."
            }
            cta="Back to my products"
            onCta={() => nav("s-products")}
          />
        </div>
      );
    }
    if (editingLoading || !editingProduct) {
      return (
        <div className="bz-seller-page">
          <div style={{ display: "flex", justifyContent: "center", padding: "96px 24px" }}>
            <Spinner />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="bz-seller-page">
      <div className="bz-seller-add-layout">
        <div className="bz-seller-add-form">
          <SellerHelpBar />

          <AppLink
            href={pathFromScreen(isEdit ? "s-products" : "s-dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-500)",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
              fontSize: ".875rem",
              textDecoration: "none",
            }}
          >
            <Icon name="chevronLeft" size={16} />{" "}
            {isEdit ? "Back to my products" : "Back to dashboard"}
          </AppLink>

          {isEdit &&
            editing &&
            (editing.listingStatus === "frozen" ||
              editing.listingStatus === "pending_reinstatement") &&
            editing.moderationFeedback && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  border: "1.5px solid var(--red)",
                  background: "rgba(230,57,70,.06)",
                }}
              >
                <div style={{ fontWeight: 800, color: "var(--danger)", marginBottom: 6 }}>
                  This listing was taken down
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: ".875rem",
                    color: "var(--ink-700)",
                    lineHeight: 1.5,
                  }}
                >
                  {editing.moderationFeedback}
                </p>
                {editing.listingStatus === "frozen" && (
                  <p style={{ margin: "8px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                    Update the product below, then acknowledge from My products so our team can
                    restore it.
                  </p>
                )}
              </div>
            )}

          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            {isEdit ? t("seller.products.editProduct") : t("seller.products.addAProduct")}
          </h1>

          {/* Progress */}
          <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
            {[
              photosOk,
              titleOk && descriptionOk,
              categoryOk,
              hasVariants ? variantsOk : price && stock,
            ].map((done, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: done ? "var(--success)" : "var(--line-200)",
                }}
              />
            ))}
          </div>

          {/* Step 1 — Photos */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 18,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: photosOk ? "var(--success)" : "var(--saffron)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {photosOk ? <Icon name="check" size={18} color="#fff" /> : 1}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  {isEdit ? "Photos" : "Add photos"}{" "}
                  <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>
                    3 required · up to 5
                  </span>
                </h3>
              </div>
            </div>
            <ProductPhotoPicker
              photos={productPhotos}
              onChange={setProductPhotos}
              min={3}
              max={5}
            />
          </div>

          {/* Step 2 — Describe */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 18,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: titleOk && descriptionOk ? "var(--success)" : "var(--blue)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {titleOk && descriptionOk ? <Icon name="check" size={18} color="#fff" /> : 2}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  Describe your product
                </h3>
              </div>
            </div>

            <label
              style={{
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Product name
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 17 Pro Max 1TB"
              style={{
                width: "100%",
                height: 56,
                fontSize: "1rem",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "0 16px",
                outline: "none",
                fontFamily: "var(--font-sans)",
                marginBottom: 12,
              }}
            />

            <label
              style={{
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Description <span style={{ color: "var(--red)", fontWeight: 800 }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Handwoven pashmina shawl in charcoal grey, made from 100% Himalayan cashmere by artisans in Kathmandu. Soft, lightweight and warm — perfect for everyday wear or gifting. Measures 200×70 cm and comes in five colours to match any outfit."
              rows={4}
              required
              minLength={10}
              style={{
                width: "100%",
                fontSize: "1rem",
                border: `1.5px solid ${descriptionOk ? "var(--line-200)" : "var(--saffron)"}`,
                borderRadius: "var(--r-md)",
                padding: "12px 16px",
                outline: "none",
                fontFamily: "var(--font-sans)",
                resize: "vertical",
                marginBottom: descriptionOk ? 12 : 6,
              }}
            />
            {!descriptionOk && description.length > 0 && (
              <p style={{ fontSize: ".75rem", color: "var(--saffron)", margin: "0 0 12px" }}>
                Add at least {10 - description.trim().length} more character(s).
              </p>
            )}
            {!descriptionOk && description.length === 0 && (
              <p style={{ fontSize: ".75rem", color: "var(--ink-400)", margin: "0 0 12px" }}>
                Required — shown to buyers on the product page.
              </p>
            )}

            <label
              style={{
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => pickCategory(e.target.value)}
              disabled={isEdit}
              style={{
                width: "100%",
                height: 56,
                fontSize: "1rem",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "0 14px",
                outline: "none",
                background: isEdit ? "var(--line-100)" : "#fff",
                fontFamily: "var(--font-sans)",
                color: category ? "var(--ink-900)" : "var(--ink-400)",
                fontWeight: category ? 600 : 400,
                cursor: isEdit ? "not-allowed" : "pointer",
              }}
            >
              <option value="">Pick a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.en}
                </option>
              ))}
            </select>
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
              {isEdit
                ? "Category can't be changed after a product is listed."
                : "Picking the right category shows buyers the right details — and helps them find you."}
            </p>
          </div>

          {/* Product details — category-specific, optional but boosts findability */}
          {category && attrFields.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--tint-blue-50)",
                    color: "var(--blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="sliders" size={18} color="var(--blue)" />
                </span>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Product details</h3>
                  <span
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 700,
                      color: "var(--ink-500)",
                      background: "var(--line-100)",
                      padding: "3px 10px",
                      borderRadius: "var(--r-full)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Optional · skip anytime
                  </span>
                </div>
              </div>
              <p style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                Add only what matters for this item. More detail = more buyer trust.
              </p>

              <CategoryAttrFields category={category} values={attrs} onChange={setAttrs} />
            </div>
          )}

          {/* Step 3 — Price & stock (or variants) */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 18,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: (hasVariants ? variantsOk : price && stock)
                    ? "var(--success)"
                    : "var(--ink-400)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {(hasVariants ? variantsOk : price && stock) ? (
                  <Icon name="check" size={18} color="#fff" />
                ) : (
                  3
                )}
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Price &amp; stock</h3>
              </div>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: ".8125rem",
                  fontWeight: 700,
                  color: "var(--ink-700)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--red)" }}
                />
                Has sizes/colors
              </label>
            </div>

            {!hasVariants ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        fontSize: ".8125rem",
                        fontWeight: 700,
                        color: "var(--ink-700)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Price (Rs.)
                    </label>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="1200"
                      className="tnum"
                      style={{
                        width: "100%",
                        height: 64,
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        textAlign: "center",
                        border: "1.5px solid var(--line-200)",
                        borderRadius: "var(--r-md)",
                        fontFamily: "var(--font-sans)",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: ".8125rem",
                        fontWeight: 700,
                        color: "var(--ink-700)",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Stock
                    </label>
                    <input
                      value={stock}
                      onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="15"
                      className="tnum"
                      style={{
                        width: "100%",
                        height: 64,
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        textAlign: "center",
                        border: "1.5px solid var(--line-200)",
                        borderRadius: "var(--r-md)",
                        fontFamily: "var(--font-sans)",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Discount (sale) — single-price products. The Price above is the
                  regular price; this sets the discounted price buyers see. */}
                <div
                  style={{
                    marginTop: 14,
                    border: "1.5px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: 14,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      fontWeight: 700,
                      color: "var(--ink-700)",
                      fontSize: ".9375rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={onSale}
                      onChange={(e) => setOnSale(e.target.checked)}
                    />
                    Put this product on sale
                  </label>

                  {onSale && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        {(
                          [
                            ["percent", "% off"],
                            ["amount", "Set sale price"],
                          ] as const
                        ).map(([mode, label]) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setSaleMode(mode)}
                            style={{
                              flex: 1,
                              height: 40,
                              borderRadius: "var(--r-md)",
                              border:
                                saleMode === mode
                                  ? "1.5px solid var(--blue-deep)"
                                  : "1.5px solid var(--line-200)",
                              background: saleMode === mode ? "var(--blue-50, #eef4ff)" : "#fff",
                              color: saleMode === mode ? "var(--blue-deep)" : "var(--ink-600)",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {saleMode === "percent" ? (
                        <div>
                          <label
                            style={{
                              fontSize: ".8125rem",
                              fontWeight: 700,
                              color: "var(--ink-700)",
                              display: "block",
                              marginBottom: 6,
                            }}
                          >
                            Discount (%)
                          </label>
                          <input
                            value={salePct}
                            onChange={(e) =>
                              setSalePct(e.target.value.replace(/\D/g, "").slice(0, 2))
                            }
                            inputMode="numeric"
                            placeholder="e.g. 20"
                            className="tnum"
                            style={{
                              width: "100%",
                              height: 48,
                              padding: "0 12px",
                              border: "1.5px solid var(--line-200)",
                              borderRadius: "var(--r-md)",
                              fontFamily: "var(--font-sans)",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                        </div>
                      ) : (
                        <div>
                          <label
                            style={{
                              fontSize: ".8125rem",
                              fontWeight: 700,
                              color: "var(--ink-700)",
                              display: "block",
                              marginBottom: 6,
                            }}
                          >
                            Sale price (Rs.)
                          </label>
                          <input
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value.replace(/\D/g, ""))}
                            inputMode="numeric"
                            placeholder="e.g. 960"
                            className="tnum"
                            style={{
                              width: "100%",
                              height: 48,
                              padding: "0 12px",
                              border: "1.5px solid var(--line-200)",
                              borderRadius: "var(--r-md)",
                              fontFamily: "var(--font-sans)",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                        </div>
                      )}

                      <p
                        style={{
                          margin: "10px 0 0",
                          fontSize: ".8125rem",
                          color: saleValid ? "var(--ink-600)" : "var(--danger, #d23)",
                        }}
                      >
                        {!saleValid
                          ? saleMode === "percent"
                            ? "Enter a percentage between 1 and 99."
                            : "Sale price must be a positive number below the regular price."
                          : `Buyers pay Rs. ${saleEffectivePrice.toLocaleString("en-IN")} ` +
                            `(was Rs. ${baseNum.toLocaleString("en-IN")}, −${
                              baseNum > 0 ? Math.round((1 - saleEffectivePrice / baseNum) * 100) : 0
                            }%).`}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p style={{ margin: "0 0 10px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                  Add one row per variant (e.g. size, color).
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {variants.map((v) => (
                    <div
                      key={v.id}
                      style={{
                        border: "1.5px solid var(--line-200)",
                        borderRadius: "var(--r-md)",
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.4fr 1fr 1fr auto",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          value={v.name}
                          onChange={(e) => updateVariant(v.id, "name", e.target.value)}
                          placeholder="Variant (e.g. Large, Red)"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            height: 48,
                            padding: "0 12px",
                            border: "1.5px solid var(--line-200)",
                            borderRadius: "var(--r-md)",
                            fontFamily: "var(--font-sans)",
                            outline: "none",
                          }}
                        />
                        <input
                          value={v.price}
                          onChange={(e) =>
                            updateVariant(v.id, "price", e.target.value.replace(/\D/g, ""))
                          }
                          inputMode="numeric"
                          placeholder="Price"
                          className="tnum"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            height: 48,
                            padding: "0 12px",
                            border: "1.5px solid var(--line-200)",
                            borderRadius: "var(--r-md)",
                            fontFamily: "var(--font-sans)",
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                        <input
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(v.id, "stock", e.target.value.replace(/\D/g, ""))
                          }
                          inputMode="numeric"
                          placeholder="Stock"
                          className="tnum"
                          style={{
                            width: "100%",
                            minWidth: 0,
                            height: 48,
                            padding: "0 12px",
                            border: "1.5px solid var(--line-200)",
                            borderRadius: "var(--r-md)",
                            fontFamily: "var(--font-sans)",
                            outline: "none",
                            textAlign: "center",
                          }}
                        />
                        <button
                          onClick={() => removeVariant(v.id)}
                          disabled={variants.length <= 1}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "var(--r-md)",
                            border: "1.5px solid var(--line-200)",
                            background: "#fff",
                            cursor: variants.length <= 1 ? "default" : "pointer",
                            color: "var(--danger)",
                            opacity: variants.length <= 1 ? 0.3 : 1,
                          }}
                        >
                          <Icon name="trash" size={16} color="var(--danger)" />
                        </button>
                      </div>

                      {/* Per-variant discount. The Price field above is the
                          regular price; this sets the discounted price for this
                          variant only (removable any time). */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: ".8125rem",
                          fontWeight: 700,
                          color: "var(--ink-600)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(v.onSale)}
                          onChange={(e) => updateVariant(v.id, "onSale", e.target.checked)}
                        />
                        Put this variant on sale
                      </label>
                      {v.onSale && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <select
                            value={v.saleMode ?? "percent"}
                            onChange={(e) => updateVariant(v.id, "saleMode", e.target.value)}
                            style={{
                              height: 40,
                              borderRadius: "var(--r-md)",
                              border: "1.5px solid var(--line-200)",
                              padding: "0 8px",
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            <option value="percent">% off</option>
                            <option value="amount">Sale price</option>
                          </select>
                          {(v.saleMode ?? "percent") === "percent" ? (
                            <input
                              value={v.salePct ?? ""}
                              onChange={(e) =>
                                updateVariant(
                                  v.id,
                                  "salePct",
                                  e.target.value.replace(/\D/g, "").slice(0, 2),
                                )
                              }
                              inputMode="numeric"
                              placeholder="% e.g. 20"
                              className="tnum"
                              style={{
                                flex: 1,
                                minWidth: 80,
                                height: 40,
                                padding: "0 10px",
                                border: "1.5px solid var(--line-200)",
                                borderRadius: "var(--r-md)",
                                textAlign: "center",
                                fontFamily: "var(--font-sans)",
                              }}
                            />
                          ) : (
                            <input
                              value={v.salePrice ?? ""}
                              onChange={(e) =>
                                updateVariant(v.id, "salePrice", e.target.value.replace(/\D/g, ""))
                              }
                              inputMode="numeric"
                              placeholder="Sale Rs."
                              className="tnum"
                              style={{
                                flex: 1,
                                minWidth: 80,
                                height: 40,
                                padding: "0 10px",
                                border: "1.5px solid var(--line-200)",
                                borderRadius: "var(--r-md)",
                                textAlign: "center",
                                fontFamily: "var(--font-sans)",
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: ".75rem",
                              color: isSaleValid(variantSaleInput(v))
                                ? "var(--ink-500)"
                                : "var(--danger, #d23)",
                            }}
                          >
                            {isSaleValid(variantSaleInput(v))
                              ? `Buyers pay Rs. ${saleEffective(variantSaleInput(v)).toLocaleString("en-IN")}`
                              : "Enter a valid discount below the price"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="plus"
                  onClick={addVariant}
                  style={{ marginTop: 10 }}
                >
                  Add another
                </Button>
              </div>
            )}
          </div>

          {/* Step 4 — Bargaining (optional) */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 18,
              marginBottom: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--tint-red-50)",
                  color: "var(--red)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="bargain" size={18} color="var(--red)" />
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  Allow bargaining?{" "}
                  <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>
                    Optional
                  </span>
                </h3>
              </div>
              {!hasVariants && (
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bargainOk}
                    onChange={(e) => setBargainOk(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--red)" }}
                  />
                  <span
                    style={{
                      fontSize: ".75rem",
                      fontWeight: 700,
                      color: bargainOk ? "var(--red)" : "var(--ink-400)",
                    }}
                  >
                    {bargainOk ? "ON" : "OFF"}
                  </span>
                </label>
              )}
            </div>

            {hasVariants ? (
              <>
                <p style={{ fontSize: ".8125rem", color: "var(--ink-500)", margin: "0 0 12px" }}>
                  Configure bargaining per variant — each can have its own floor price.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {variants
                    .filter((v) => v.name && v.price)
                    .map((v) => {
                      const floorError = variantFloorError(v);
                      return (
                        <div
                          key={v.id}
                          style={{
                            border: `1.5px solid ${v.allowBargaining ? "var(--red)" : "var(--line-200)"}`,
                            borderRadius: "var(--r-md)",
                            padding: "10px 12px",
                            background: v.allowBargaining ? "rgba(220,38,38,.03)" : "#fff",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(v.allowBargaining)}
                              onChange={(e) =>
                                updateVariant(v.id, "allowBargaining", e.target.checked)
                              }
                              style={{ width: 16, height: 16, accentColor: "var(--red)" }}
                            />
                            <span style={{ fontWeight: 700, fontSize: ".875rem", flex: 1 }}>
                              {v.name}
                            </span>
                            <span
                              className="tnum"
                              style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}
                            >
                              Rs. {Number(v.price).toLocaleString("en-IN")}
                            </span>
                          </label>
                          {v.allowBargaining && (
                            <div style={{ marginTop: 8, paddingLeft: 26 }}>
                              <label
                                style={{
                                  fontSize: ".75rem",
                                  color: "var(--ink-600)",
                                  display: "block",
                                  marginBottom: 4,
                                }}
                              >
                                Min. price (Rs.)
                              </label>
                              <input
                                type="number"
                                min={1}
                                placeholder="e.g. 800"
                                value={v.minimumPrice ?? ""}
                                onChange={(e) =>
                                  updateVariant(v.id, "minimumPrice", e.target.value)
                                }
                                aria-invalid={floorError ? true : undefined}
                                style={{
                                  width: "100%",
                                  maxWidth: 200,
                                  padding: "8px 10px",
                                  border: `1.5px solid ${floorError ? "var(--danger, #d23)" : "var(--line-200)"}`,
                                  borderRadius: "var(--r-md)",
                                  fontSize: ".8125rem",
                                }}
                              />
                              <span
                                style={{
                                  display: "block",
                                  marginTop: 4,
                                  fontSize: ".72rem",
                                  color: floorError ? "var(--danger, #d23)" : "var(--ink-400)",
                                }}
                              >
                                {floorError ??
                                  `Must be less than Rs. ${variantListedPrice(v).toLocaleString("en-IN")}`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <p style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 8 }}>
                  Offers at or above the min price are auto-accepted. Buyers never see this limit.
                </p>
              </>
            ) : (
              bargainOk && (
                <>
                  <label
                    style={{
                      fontSize: ".8125rem",
                      color: "var(--ink-700)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Lowest price you'll accept (Rs.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 800"
                    value={bargainMinPrice}
                    onChange={(e) => setBargainMinPrice(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1.5px solid var(--line-200)",
                      borderRadius: "var(--r-md)",
                      fontSize: ".875rem",
                    }}
                  />
                  <p style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 4 }}>
                    Offers at or above this price are auto-accepted. Buyers never see this limit.
                  </p>
                </>
              )
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            full
            disabled={!canPublish || publishing}
            loading={publishing}
            onClick={handlePublish}
          >
            {isEdit
              ? publishing
                ? "Saving…"
                : "Save changes"
              : publishing
                ? "Publishing…"
                : "Publish"}
          </Button>
          {!canPublish && !publishing && (
            <p
              style={{
                fontSize: ".75rem",
                color: "var(--ink-500)",
                marginTop: 8,
                textAlign: "center",
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: "var(--ink-700)" }}>Still needed:</strong>{" "}
              {publishMissing.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 4.4b Product View (read-only) ---------- */
export function SellerProductView({ item }: { item: SellerInventoryItem | null }) {
  const { nav } = useBz();
  const { data: product, isLoading, isError, error } = useProduct(item?.id ?? null);

  if (!item) {
    return (
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "20px clamp(14px, 4vw, 28px) 100px",
        }}
      >
        <SellerHelpBar />
        <EmptyState
          title="No product selected"
          message="Go back to your inventory and select a product to view."
          cta="Back to products"
          onCta={() => nav("s-products")}
        />
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "20px clamp(14px, 4vw, 28px) 100px",
        }}
      >
        <SellerHelpBar />

        {/* Back + actions header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => nav("s-products")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--blue)",
              fontWeight: 700,
              fontSize: ".875rem",
              padding: 0,
            }}
          >
            <Icon name="chevronLeft" size={18} color="var(--blue)" />
            Back to products
          </button>
          <div style={{ flex: 1 }} />
          <Button
            variant="secondary"
            icon="edit"
            onClick={() => {
              editProductRef.current = item;
              nav("s-edit");
            }}
          >
            Edit
          </Button>
        </div>

        {(item.listingStatus === "frozen" || item.listingStatus === "pending_reinstatement") &&
          item.moderationFeedback && (
            <div
              role="alert"
              style={{
                marginBottom: 20,
                padding: "14px 16px",
                borderRadius: "var(--r-md)",
                border: `1.5px solid ${item.listingStatus === "frozen" ? "var(--red)" : "var(--saffron)"}`,
                background:
                  item.listingStatus === "frozen" ? "rgba(230,57,70,.06)" : "rgba(247,127,0,.06)",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: ".8125rem",
                  color: "var(--danger)",
                  marginBottom: 6,
                }}
              >
                {item.listingStatus === "frozen"
                  ? "This listing was taken down"
                  : "Awaiting admin review"}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: ".875rem",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                }}
              >
                {item.moderationFeedback}
              </p>
              {item.listingStatus === "frozen" && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                  }}
                >
                  Edit this product to address the feedback, then acknowledge from My Products so
                  our team can restore it.
                </p>
              )}
              {item.listingStatus === "pending_reinstatement" && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: ".8125rem",
                    color: "var(--ink-500)",
                  }}
                >
                  Submitted for review. You&apos;ll be notified when the listing is live again.
                </p>
              )}
            </div>
          )}

        {/* Product images */}
        {product && (product.images?.length || product.img) ? (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              {(product.images ?? (product.img ? [product.img] : [])).map((src, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                    border: "1.5px solid var(--line-200)",
                    background: "var(--line-100)",
                  }}
                >
                  <img
                    src={src}
                    alt={`${item.name} photo ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : item.img ? (
          <div style={{ marginBottom: 24 }}>
            <img
              src={item.img}
              alt={item.name}
              style={{
                width: "100%",
                maxWidth: 320,
                height: 240,
                objectFit: "cover",
                borderRadius: "var(--r-md)",
                border: "1.5px solid var(--line-200)",
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <Placeholder
              icon={item.icon}
              tint={item.tint}
              style={{ width: 120, height: 120 }}
              radius="var(--r-md)"
            />
          </div>
        )}

        {/* Title + price */}
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
            fontWeight: 800,
            color: "var(--ink-900)",
          }}
        >
          {product?.name ?? item.name}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <span
            className="tnum"
            style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--blue-deep)" }}
          >
            Rs. {(product?.price ?? item.price).toLocaleString("en-IN")}
          </span>
          {product?.original && product.original > product.price && (
            <span
              className="tnum"
              style={{
                fontSize: ".875rem",
                color: "var(--ink-400)",
                textDecoration: "line-through",
              }}
            >
              Rs. {product.original.toLocaleString("en-IN")}
            </span>
          )}
          {product?.discountPct && (
            <span
              style={{
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--success)",
                background: "rgba(22,163,74,.08)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {product.discountPct}% off
            </span>
          )}
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Stock */}
          <DetailTile
            label="Stock"
            value={String(item.stock)}
            tone={item.stock === 0 ? "danger" : item.stock <= 3 ? "saffron" : "success"}
            sub={item.stock === 0 ? "Out of stock" : item.stock <= 3 ? "Low stock" : "In stock"}
          />
          {/* Rating */}
          {product && product.rating > 0 && (
            <DetailTile
              label="Rating"
              value={product.rating.toFixed(1)}
              sub={`${product.reviews} review${product.reviews === 1 ? "" : "s"}`}
            />
          )}
          {/* Bargaining — the floor is private to the seller, so it's read from
              the seller-only inventory row, not the public product. */}
          <DetailTile
            label="Bargaining"
            value={item?.allowBargaining ? "Enabled" : "Disabled"}
            sub={
              item?.minimumPrice
                ? `Min Rs. ${item.minimumPrice.toLocaleString("en-IN")}`
                : undefined
            }
          />
          {/* Category */}
          {product?.cat && <DetailTile label="Category" value={product.cat} />}
        </div>

        {/* Variants */}
        {product?.variants && product.variants.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: ".875rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Options
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {product.variants.map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 20px",
                    background: i === 0 ? "var(--blue-deep)" : "#fff",
                    color: i === 0 ? "#fff" : "var(--ink-900)",
                    border: `1.5px solid ${i === 0 ? "var(--blue-deep)" : "var(--line-200)"}`,
                    borderRadius: "var(--r-md)",
                    minHeight: 52,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: ".9375rem" }}>{v.name}</span>
                  <span
                    className="tnum"
                    style={{
                      fontWeight: 700,
                      fontSize: ".875rem",
                      opacity: i === 0 ? 0.85 : 1,
                      color: i === 0 ? "#fff" : "var(--ink-600)",
                    }}
                  >
                    Rs. {v.price.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
            {/* Stock per variant */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {product.variants.map((v) => (
                <span
                  key={v.id}
                  className="tnum"
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background:
                      v.stock === 0
                        ? "rgba(220,38,38,.08)"
                        : v.stock <= 3
                          ? "rgba(247,127,0,.08)"
                          : "var(--line-100)",
                    color:
                      v.stock === 0
                        ? "var(--danger)"
                        : v.stock <= 3
                          ? "var(--saffron)"
                          : "var(--ink-500)",
                  }}
                >
                  {v.name}: {v.stock} in stock
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {product?.description && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: ".875rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Description
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: ".875rem",
                color: "var(--ink-600)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {product.description}
            </p>
          </div>
        )}

        {/* Specifications */}
        {product?.metadata && Object.keys(product.metadata).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: ".875rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Specifications
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(product.metadata).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "8px 12px",
                    background: "var(--line-50, #fafafa)",
                    borderRadius: "var(--r-sm)",
                    fontSize: ".8125rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--ink-600)", minWidth: 100 }}>
                    {key}
                  </span>
                  <span style={{ color: "var(--ink-800)" }}>{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {product?.hasVideo && product?.videoUrl && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: ".875rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Product Video
            </h3>
            <VideoPlayer src={product.videoUrl} thumb={product.videoThumb} />
          </div>
        )}

        {/* Footer info */}
        {product?.createdAt && (
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 8 }}>
            Listed on{" "}
            {new Date(product.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        )}
      </div>
    </ApiState>
  );
}

function DetailTile({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  const color =
    tone === "danger"
      ? "var(--danger)"
      : tone === "saffron"
        ? "var(--saffron)"
        : tone === "success"
          ? "var(--success)"
          : "var(--ink-900)";
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "#fff",
        border: "1.5px solid var(--line-200)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div
        style={{
          fontSize: ".75rem",
          fontWeight: 700,
          color: "var(--ink-500)",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: ".03em",
        }}
      >
        {label}
      </div>
      <div className="tnum" style={{ fontSize: "1.125rem", fontWeight: 800, color }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

/* ---------- 4.5 Inventory — swipe-to-sell ---------- */
const EMPTY_INVENTORY: SellerInventoryItem[] = [];

export const INV_SORTS = [
  { value: "added", label: "Recently added" },
  { value: "stockLow", label: "Stock low → high" },
  { value: "priceLow", label: "Price low → high" },
  { value: "name", label: "Name A → Z" },
];

export function SellerInventory() {
  const { t } = useTranslation();
  const { nav, toast } = useBz();
  const { data: inventoryData = EMPTY_INVENTORY, isLoading, isError, error } = useSellerInventory();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const acknowledgeModeration = useAcknowledgeProductModeration();
  const [deleteTarget, setDeleteTarget] = useState<SellerInventoryItem | null>(null);
  const [items, setItems] = useState<SellerInventoryItem[]>([]);
  useEffect(() => {
    setItems(inventoryData);
  }, [inventoryData]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  // Pending (uncommitted) stock edits. Kept OUTSIDE `items` so the inventory
  // refetch triggered by every save (or window refocus) can't silently wipe an
  // in-progress edit. `stockDraft`: productId -> stock (single-SKU products).
  // `variantStockDraft`: productId -> { variantId -> stock }.
  const [stockDraft, setStockDraft] = useState<Record<string, number>>({});
  const [variantStockDraft, setVariantStockDraft] = useState<
    Record<string, Record<string, number>>
  >({});
  const [status, setStatus] = useState("all"); // all | active | low | oos
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("added");

  // Effective (draft-aware) stock readers — what the seller currently sees.
  const effStock = useCallback(
    (it: SellerInventoryItem) => stockDraft[it.id] ?? it.stock,
    [stockDraft],
  );
  const effVariantStock = useCallback(
    (productId: string, v: CreateProductVariantPayload) =>
      variantStockDraft[productId]?.[v.id] ?? v.stock,
    [variantStockDraft],
  );
  // Server variant list overlaid with any local drafts (the payload to save).
  const effVariants = useCallback(
    (it: SellerInventoryItem): CreateProductVariantPayload[] =>
      (it.variants ?? []).map((v) => ({ ...v, stock: effVariantStock(it.id, v) })),
    [effVariantStock],
  );
  const stockDirty = useCallback(
    (it: SellerInventoryItem) => {
      if (it.hasVariants && it.variants?.length) {
        return it.variants.some((v) => effVariantStock(it.id, v) !== v.stock);
      }
      return effStock(it) !== it.stock;
    },
    [effStock, effVariantStock],
  );

  // Local-only edits (no backend call). The `+`/`−` steppers and the typed
  // input mutate the draft; nothing hits the API until Save.
  const adjustStock = (it: SellerInventoryItem, delta: number) => {
    if (savingId) return;
    const next = Math.max(0, effStock(it) + delta);
    setStockDraft((d) => ({ ...d, [it.id]: next }));
  };
  const typeStock = (it: SellerInventoryItem, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setStockDraft((d) => ({ ...d, [it.id]: digits === "" ? 0 : parseInt(digits, 10) }));
  };
  const adjustVariant = (
    it: SellerInventoryItem,
    v: CreateProductVariantPayload,
    delta: number,
  ) => {
    if (savingId) return;
    const next = Math.max(0, effVariantStock(it.id, v) + delta);
    setVariantStockDraft((d) => ({ ...d, [it.id]: { ...(d[it.id] ?? {}), [v.id]: next } }));
  };
  const typeVariant = (it: SellerInventoryItem, v: CreateProductVariantPayload, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const next = digits === "" ? 0 : parseInt(digits, 10);
    setVariantStockDraft((d) => ({ ...d, [it.id]: { ...(d[it.id] ?? {}), [v.id]: next } }));
  };

  const clearDraft = (id: string) => {
    setStockDraft((d) => {
      if (!(id in d)) return d;
      const next = { ...d };
      delete next[id];
      return next;
    });
    setVariantStockDraft((d) => {
      if (!(id in d)) return d;
      const next = { ...d };
      delete next[id];
      return next;
    });
  };

  // The single backend-touching path for stock: commits the final value in ONE
  // PATCH, optimistically updates the row, then clears the draft so the inventory
  // refetch reconciles cleanly. On failure the draft is kept for a retry.
  const commitStock = useCallback(
    async (
      id: string,
      payload: { stock: number } | { variants: CreateProductVariantPayload[] },
    ) => {
      const prev = items.find((i) => i.id === id);
      if (!prev || savingId) return;
      if ("stock" in payload && payload.stock === prev.stock) {
        clearDraft(id);
        return;
      }
      setSavingId(id);
      try {
        await updateProduct.mutateAsync({ id, ...payload });
        setItems((list) =>
          list.map((it) => {
            if (it.id !== id) return it;
            if ("variants" in payload) {
              const total = payload.variants.reduce((sum, v) => sum + v.stock, 0);
              return { ...it, stock: total, variants: payload.variants };
            }
            return { ...it, stock: payload.stock };
          }),
        );
        clearDraft(id);
        toast("Stock saved");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not update stock");
      } finally {
        setSavingId(null);
      }
    },
    [items, updateProduct, toast, savingId],
  );

  const saveStock = (it: SellerInventoryItem) => {
    if (it.hasVariants && it.variants?.length) {
      void commitStock(it.id, { variants: effVariants(it) });
    } else {
      void commitStock(it.id, { stock: effStock(it) });
    }
  };

  // "Sold one in shop" is a discrete real-world sale: commit −1 immediately
  // (folding in any pending draft) in a single call.
  const sellInShop = (it: SellerInventoryItem) => {
    if (savingId) return;
    const cur = effStock(it);
    if (cur <= 0) return;
    void commitStock(it.id, { stock: cur - 1 });
    toast("Sold one in shop · −1 stock");
  };
  const sellVariantInShop = (it: SellerInventoryItem, v: CreateProductVariantPayload) => {
    if (savingId) return;
    if (effVariantStock(it.id, v) <= 0) return;
    const variants = effVariants(it).map((x) => (x.id === v.id ? { ...x, stock: x.stock - 1 } : x));
    void commitStock(it.id, { variants });
    toast(`Sold one ${v.name} in shop`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteProduct.isPending) return;
    const { id, name } = deleteTarget;
    try {
      await deleteProduct.mutateAsync(id);
      // Drop it from the local optimistic list so the row disappears before the
      // inventory refetch lands.
      setItems((list) => list.filter((it) => it.id !== id));
      setExpanded((cur) => (cur === id ? null : cur));
      setDeleteTarget(null);
      toast(`${name} deleted`);
    } catch (err) {
      // 409 = product has order history (server keeps it to protect orders).
      // Keep the dialog open so the seller reads why and can cancel.
      toast(err instanceof Error ? err.message : "Could not delete this product");
    }
  };

  const savePrice = async (id: string) => {
    const it = items.find((i) => i.id === id);
    const raw = String(priceDraft[id] ?? it?.price ?? "").replace(/\D/g, "");
    const next = parseInt(raw, 10);
    if (!it || !Number.isFinite(next) || next <= 0) {
      toast("Enter a valid price (Rs.)");
      return;
    }
    if (next === it.price) return;
    setSavingId(id);
    try {
      await updateProduct.mutateAsync({ id, price: next });
      setItems((list) => list.map((i) => (i.id === id ? { ...i, price: next } : i)));
      toast("Price saved");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update price");
    } finally {
      setSavingId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((cur) => {
      if (cur === id) return null;
      const it = items.find((i) => i.id === id);
      if (it) setPriceDraft((d) => ({ ...d, [id]: String(it.price) }));
      return id;
    });
  };

  const bucket = (it: SellerInventoryItem) => (it.stock === 0 ? "oos" : "active");
  const counts = {
    all: items.length,
    active: items.filter((it) => bucket(it) === "active").length,
    oos: items.filter((it) => bucket(it) === "oos").length,
  };
  const statusTabs = [
    { id: "all", label: t("seller.products.filterAll"), tone: "ink" },
    { id: "active", label: t("seller.products.filterActive"), tone: "success" },
    { id: "oos", label: t("seller.products.filterOos"), tone: "danger" },
  ];
  const sortOptions = useMemo(
    () => [
      { value: "added", label: t("seller.products.sortAdded") },
      { value: "stockLow", label: t("seller.products.sortStockLow") },
      { value: "priceLow", label: t("seller.products.sortPriceLow") },
      { value: "name", label: t("seller.products.sortName") },
    ],
    [t],
  );

  let visible = items.filter((it) => status === "all" || bucket(it) === status);
  if (search.trim()) {
    const q = search.toLowerCase();
    visible = visible.filter((it) => it.name.toLowerCase().includes(q));
  }
  if (sort === "stockLow") visible = [...visible].sort((a, b) => a.stock - b.stock);
  else if (sort === "priceLow") visible = [...visible].sort((a, b) => a.price - b.price);
  else if (sort === "name") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));

  const filtersActive = status !== "all" || search.trim() || sort !== "added";
  const clearFilters = () => {
    setStatus("all");
    setSearch("");
    setSort("added");
  };
  const invPaged = usePages(visible, 8, `${status}|${search}|${sort}`);

  return (
    <>
      <ApiState isLoading={isLoading} isError={isError} error={error}>
        <div
          className="bz-container-pad"
          style={{
            maxWidth: "var(--container)",
            margin: "0 auto",
            padding: "20px clamp(14px, 4vw, 28px) 100px",
          }}
        >
          <SellerHelpBar />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                }}
              >
                {t("seller.products.title")}
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                {t("seller.products.subtitle")}
              </p>
            </div>
            <Button variant="primary" icon="plus" href={pathFromScreen("s-add")}>
              {t("seller.products.addProduct")}
            </Button>
          </div>

          {/* Search + sort row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px", position: "relative", minWidth: 200 }}>
              <Icon
                name="search"
                size={16}
                color="var(--ink-400)"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  height: 40,
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontSize: ".875rem",
                  background: "#fff",
                  color: "var(--ink-900)",
                  outline: "none",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 24,
                    height: 24,
                    borderRadius: "var(--r-full)",
                    border: "none",
                    background: "var(--line-200)",
                    color: "var(--ink-700)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="x" size={12} color="var(--ink-700)" />
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                height: 40,
                padding: "0 12px",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontSize: ".8125rem",
                background: "#fff",
                color: "var(--ink-900)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
            {filtersActive && (
              <button
                onClick={clearFilters}
                style={{
                  height: 40,
                  padding: "0 14px",
                  border: "none",
                  background: "none",
                  color: "var(--ink-500)",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Status pills */}
          <div style={{ marginBottom: 16 }}>
            <ChipGroup
              options={statusTabs.map((t) => ({
                value: t.id,
                label: `${t.label} (${counts[t.id as keyof typeof counts]})`,
              }))}
              value={status}
              onChange={setStatus}
            />
          </div>

          {visible.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                border: "1.5px dashed var(--line-200)",
                borderRadius: "var(--r-lg)",
                color: "var(--ink-500)",
              }}
            >
              <Icon name="package" size={48} color="var(--ink-300)" />
              <p style={{ margin: "12px 0 0", fontWeight: 800, color: "var(--ink-900)" }}>
                No products match
              </p>
              <p style={{ margin: "4px 0 14px", fontSize: ".8125rem" }}>
                Try clearing search or status filter.
              </p>
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {invPaged.visible.map((it) => {
                  const low = it.stock <= 3 && it.stock > 0;
                  const oos = it.stock === 0;
                  const isOpen = expanded === it.id;
                  const modStatus = it.listingStatus ?? "active";
                  const isFrozen = modStatus === "frozen";
                  const pendingReview = modStatus === "pending_reinstatement";
                  const modBorder = isFrozen
                    ? "var(--red)"
                    : pendingReview
                      ? "var(--saffron)"
                      : low
                        ? "var(--saffron)"
                        : "var(--line-200)";
                  return (
                    <div
                      key={it.id}
                      style={{
                        background: isFrozen
                          ? "rgba(230,57,70,.04)"
                          : pendingReview
                            ? "rgba(247,127,0,.06)"
                            : oos
                              ? "var(--line-100)"
                              : low
                                ? "rgba(247,127,0,.08)"
                                : "#fff",
                        border: `1.5px solid ${modBorder}`,
                        borderRadius: "var(--r-lg)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpanded(it.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          padding: 14,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {it.img ? (
                          <img
                            src={it.img}
                            alt=""
                            style={{
                              width: 72,
                              height: 72,
                              flexShrink: 0,
                              borderRadius: "var(--r-md)",
                              objectFit: "cover",
                              border: "1px solid var(--line-200)",
                              background: "var(--line-100)",
                            }}
                          />
                        ) : (
                          <Placeholder
                            icon={it.icon}
                            tint={it.tint}
                            style={{ width: 72, height: 72, flexShrink: 0 }}
                            radius="var(--r-md)"
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{it.name}</div>
                          {(isFrozen || pendingReview) && (
                            <div style={{ marginTop: 4 }}>
                              <Chip tone={isFrozen ? "red" : "saffron"} size="sm">
                                {isFrozen ? "Taken down" : "Awaiting review"}
                              </Chip>
                            </div>
                          )}
                          <div
                            className="tnum"
                            style={{
                              fontSize: ".875rem",
                              color: "var(--blue-deep)",
                              fontWeight: 800,
                              marginTop: 2,
                            }}
                          >
                            Rs. {it.price.toLocaleString("en-IN")}
                          </div>
                          <div
                            style={{
                              fontSize: ".8125rem",
                              color: oos
                                ? "var(--danger)"
                                : low
                                  ? "var(--saffron)"
                                  : "var(--ink-500)",
                              marginTop: 2,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {oos ? (
                              <>
                                <Icon name="zap" size={14} color="var(--danger)" /> Out of stock
                              </>
                            ) : low ? (
                              <>
                                <Icon name="zap" size={14} color="var(--saffron)" /> Only {it.stock}{" "}
                                left
                              </>
                            ) : (
                              <>Stock: {it.stock}</>
                            )}
                          </div>
                        </div>
                        <Icon
                          name={isOpen ? "chevronDown" : "chevronRight"}
                          size={22}
                          color="var(--ink-400)"
                        />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0 14px 14px",
                            borderTop: "1px dashed var(--line-200)",
                          }}
                        >
                          {(isFrozen || pendingReview) && it.moderationFeedback && (
                            <div
                              style={{
                                marginTop: 14,
                                padding: 12,
                                borderRadius: "var(--r-md)",
                                background: isFrozen
                                  ? "rgba(230,57,70,.08)"
                                  : "rgba(247,127,0,.08)",
                                border: `1px solid ${isFrozen ? "rgba(230,57,70,.25)" : "rgba(247,127,0,.3)"}`,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: ".8125rem",
                                  color: "var(--blue-deep)",
                                  marginBottom: 6,
                                }}
                              >
                                Admin feedback
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: ".875rem",
                                  color: "var(--ink-700)",
                                  lineHeight: 1.5,
                                }}
                              >
                                {it.moderationFeedback}
                              </p>
                              {isFrozen && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  style={{ marginTop: 10 }}
                                  loading={acknowledgeModeration.isPending}
                                  onClick={() => {
                                    acknowledgeModeration.mutate(it.id, {
                                      onSuccess: () => {
                                        setItems((list) =>
                                          list.map((row) =>
                                            row.id === it.id
                                              ? {
                                                  ...row,
                                                  listingStatus: "pending_reinstatement",
                                                  sellerAcknowledgedAt: new Date().toISOString(),
                                                }
                                              : row,
                                          ),
                                        );
                                        toast(
                                          "Thanks — we'll review your fixes and restore the listing soon.",
                                          "success",
                                        );
                                      },
                                      onError: (err) => {
                                        toast(
                                          err instanceof Error
                                            ? err.message
                                            : "Could not submit. Try again.",
                                          "error",
                                        );
                                      },
                                    });
                                  }}
                                >
                                  I&apos;ve fixed this — submit for review
                                </Button>
                              )}
                              {pendingReview && (
                                <p
                                  style={{
                                    margin: "10px 0 0",
                                    fontSize: ".8125rem",
                                    color: "var(--ink-500)",
                                  }}
                                >
                                  Submitted for review. You&apos;ll be notified when the listing is
                                  live again.
                                </p>
                              )}
                            </div>
                          )}
                          {it.hasVariants && it.variants?.length ? (
                            <>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: ".875rem",
                                  margin: "14px 0 10px",
                                }}
                              >
                                Stock by variant
                                {savingId === it.id && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: ".75rem",
                                      color: "var(--ink-400)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Saving…
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {it.variants.map((v) => {
                                  const vStock = effVariantStock(it.id, v);
                                  const vLow = vStock <= 3 && vStock > 0;
                                  const vOos = vStock === 0;
                                  return (
                                    <div
                                      key={v.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "8px 10px",
                                        border: `1.5px solid ${vLow ? "var(--saffron)" : "var(--line-200)"}`,
                                        borderRadius: "var(--r-md)",
                                        background: vOos ? "var(--line-50)" : "#fff",
                                      }}
                                    >
                                      <span
                                        style={{ flex: 1, fontWeight: 600, fontSize: ".875rem" }}
                                      >
                                        {v.name}
                                        {vOos && (
                                          <span
                                            style={{
                                              color: "var(--danger)",
                                              marginLeft: 6,
                                              fontSize: ".75rem",
                                            }}
                                          >
                                            Out
                                          </span>
                                        )}
                                        {vLow && !vOos && (
                                          <span
                                            style={{
                                              color: "var(--saffron)",
                                              marginLeft: 6,
                                              fontSize: ".75rem",
                                            }}
                                          >
                                            Low
                                          </span>
                                        )}
                                      </span>
                                      <div
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          border: "1.5px solid var(--line-200)",
                                          borderRadius: "var(--r-md)",
                                          overflow: "hidden",
                                          background: "#fff",
                                          opacity: savingId === it.id ? 0.6 : 1,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            adjustVariant(it, v, -1);
                                          }}
                                          disabled={vStock === 0 || savingId === it.id}
                                          style={{
                                            width: 36,
                                            height: 40,
                                            background: "#fff",
                                            border: "none",
                                            cursor:
                                              vStock === 0 || savingId === it.id
                                                ? "not-allowed"
                                                : "pointer",
                                            color: "var(--ink-700)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Icon name="minus" size={14} />
                                        </button>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          aria-label={`${v.name} stock`}
                                          value={String(vStock)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => typeVariant(it, v, e.target.value)}
                                          disabled={savingId === it.id}
                                          className="tnum"
                                          style={{
                                            width: 44,
                                            height: 40,
                                            textAlign: "center",
                                            fontWeight: 800,
                                            fontSize: ".9375rem",
                                            border: "none",
                                            outline: "none",
                                            background: "transparent",
                                            color: "var(--ink-700)",
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            adjustVariant(it, v, 1);
                                          }}
                                          disabled={savingId === it.id}
                                          style={{
                                            width: 36,
                                            height: 40,
                                            background: "#fff",
                                            border: "none",
                                            cursor: savingId === it.id ? "not-allowed" : "pointer",
                                            color: "var(--ink-700)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Icon name="plus" size={14} />
                                        </button>
                                      </div>
                                      {!vOos && (
                                        <button
                                          type="button"
                                          disabled={savingId === it.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            sellVariantInShop(it, v);
                                          }}
                                          style={{
                                            height: 32,
                                            padding: "0 10px",
                                            borderRadius: "var(--r-md)",
                                            border: "1.5px solid var(--line-200)",
                                            background: "#fff",
                                            color: "var(--ink-600)",
                                            fontSize: ".75rem",
                                            fontWeight: 700,
                                            cursor: savingId === it.id ? "not-allowed" : "pointer",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          −1 shop
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div
                                className="tnum"
                                style={{
                                  fontSize: ".8125rem",
                                  color: "var(--ink-500)",
                                  marginTop: 8,
                                  fontWeight: 600,
                                }}
                              >
                                Total: {effVariants(it).reduce((sum, v) => sum + v.stock, 0)} units
                              </div>
                              {stockDirty(it) && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    loading={savingId === it.id}
                                    disabled={savingId === it.id}
                                    onClick={() => saveStock(it)}
                                  >
                                    Save stock
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={savingId === it.id}
                                    onClick={() => clearDraft(it.id)}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "14px 0",
                                  gap: 12,
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: ".875rem" }}>
                                  Change stock
                                  {savingId === it.id && (
                                    <span
                                      style={{
                                        marginLeft: 8,
                                        fontSize: ".75rem",
                                        color: "var(--ink-400)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      Saving…
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    border: "1.5px solid var(--line-200)",
                                    borderRadius: "var(--r-md)",
                                    overflow: "hidden",
                                    background: "#fff",
                                    opacity: savingId === it.id ? 0.6 : 1,
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adjustStock(it, -1);
                                    }}
                                    disabled={effStock(it) === 0 || savingId === it.id}
                                    style={{
                                      width: 44,
                                      height: 48,
                                      background: "#fff",
                                      border: "none",
                                      cursor:
                                        effStock(it) === 0 || savingId === it.id
                                          ? "not-allowed"
                                          : "pointer",
                                      color: "var(--ink-700)",
                                    }}
                                  >
                                    <Icon name="minus" size={18} />
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label="Stock"
                                    value={String(effStock(it))}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => typeStock(it, e.target.value)}
                                    disabled={savingId === it.id}
                                    className="tnum"
                                    style={{
                                      width: 56,
                                      height: 48,
                                      textAlign: "center",
                                      fontWeight: 800,
                                      fontSize: "1.125rem",
                                      border: "none",
                                      outline: "none",
                                      background: "transparent",
                                      color: "var(--ink-700)",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      adjustStock(it, 1);
                                    }}
                                    disabled={savingId === it.id}
                                    style={{
                                      width: 44,
                                      height: 48,
                                      background: "#fff",
                                      border: "none",
                                      cursor: savingId === it.id ? "not-allowed" : "pointer",
                                      color: "var(--ink-700)",
                                    }}
                                  >
                                    <Icon name="plus" size={18} />
                                  </button>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {stockDirty(it) && (
                                  <>
                                    <Button
                                      variant="primary"
                                      loading={savingId === it.id}
                                      disabled={savingId === it.id}
                                      onClick={() => saveStock(it)}
                                      icon="check"
                                    >
                                      Save stock
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      disabled={savingId === it.id}
                                      onClick={() => clearDraft(it.id)}
                                    >
                                      Reset
                                    </Button>
                                  </>
                                )}
                                {effStock(it) > 0 && (
                                  <Button
                                    variant="secondary"
                                    disabled={savingId === it.id}
                                    onClick={() => sellInShop(it)}
                                    icon="store"
                                  >
                                    Sold one in shop (−1)
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                          <div style={{ marginTop: 14 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: ".875rem",
                                marginBottom: 8,
                              }}
                            >
                              Price (Rs.)
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={priceDraft[it.id] ?? String(it.price)}
                                onChange={(e) =>
                                  setPriceDraft((d) => ({
                                    ...d,
                                    [it.id]: e.target.value.replace(/\D/g, ""),
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void savePrice(it.id);
                                }}
                                disabled={savingId === it.id}
                                className="tnum"
                                style={{
                                  flex: "1 1 140px",
                                  minWidth: 120,
                                  height: 48,
                                  padding: "0 12px",
                                  border: "1.5px solid var(--line-200)",
                                  borderRadius: "var(--r-md)",
                                  fontSize: "1rem",
                                  fontWeight: 700,
                                  outline: "none",
                                }}
                              />
                              <Button
                                variant="primary"
                                disabled={savingId === it.id}
                                onClick={() => void savePrice(it.id)}
                              >
                                Save price
                              </Button>
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: 14,
                              borderTop: "1px dashed var(--line-200)",
                              paddingTop: 14,
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              variant="secondary"
                              icon="eye"
                              disabled={savingId === it.id}
                              onClick={() => {
                                viewProductRef.current = it;
                                nav("s-product-view");
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              icon="edit"
                              disabled={savingId === it.id}
                              onClick={() => {
                                editProductRef.current = it;
                                nav("s-edit");
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              icon="trash"
                              disabled={savingId === it.id}
                              onClick={() => setDeleteTarget(it)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <PageBar
                  page={invPaged.page}
                  pageCount={invPaged.pageCount}
                  onPage={invPaged.goPage}
                  alwaysShow
                />
                <div
                  className="tnum"
                  style={{ fontSize: ".8125rem", color: "var(--ink-400)", fontWeight: 600 }}
                >
                  Showing {invPaged.from}–{invPaged.to} of {invPaged.total} products
                </div>
              </div>
            </>
          )}
        </div>
      </ApiState>
      <ProductDeleteConfirmModal
        open={deleteTarget !== null}
        pending={deleteProduct.isPending}
        productName={deleteTarget?.name ?? ""}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

/* ---------- 4.6 Payouts Ledger ---------- */
export function SellerLedger() {
  const { t } = useTranslation();
  const { data: ledger, isLoading, isError, error } = useSellerLedger();
  const rows = ledger?.rows ?? [];
  const supportEmail = "support@bazaarconepal.com";
  const supportPhone = "+977 9700053075";
  const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "Seller payout support",
  )}&body=${encodeURIComponent("Hi BazaarCo team,\n\nI need help with my seller payouts.\n\n")}`;
  const supportWhatsapp = "https://wa.me/9779700053075";
  const saveAsPdf = () => {
    if (typeof window === "undefined") return;
    window.print();
  };
  const talkToSupport = () => {
    if (typeof window === "undefined") return;
    const message = `Hi BazaarCo team,\n\nI need help with my seller payouts.`;
    const whatsappUrl = `https://wa.me/9779700053075?text=${encodeURIComponent(message)}`;
    const choice = window.confirm(
      `Contact support via:\n\n[OK] WhatsApp: ${supportPhone}\n\n[Cancel] Email: ${supportEmail}`,
    );
    if (choice) {
      window.open(whatsappUrl, "_blank");
    } else {
      window.location.href = supportMailto;
    }
  };
  const statusLabel = {
    received: {
      en: "Received",
      color: "var(--success)",
      bg: "rgba(22,163,74,.1)",
    },
    sending: { en: "Sending", color: "var(--saffron)", bg: "rgba(247,127,0,.1)" },
    held: { en: "On hold", color: "var(--danger)", bg: "rgba(220,38,38,.1)" },
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-seller-ledger-print bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <div className="bz-no-print">
          <SellerHelpBar />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            {t("seller.ledger.title")}
          </h1>
          <div className="bz-no-print">
            <Button variant="ghost" href={pathFromScreen("s-dashboard")} icon="chevronLeft">
              {t("seller.common.back")}
            </Button>
          </div>
        </div>

        <div className="bz-no-print" style={{ marginBottom: 14 }}>
          <ChipGroup
            options={[
              { value: "week", label: "This week" },
              { value: "month", label: "This month" },
              { value: "all", label: "All time" },
            ]}
            value="week"
            onChange={() => {}}
          />
        </div>

        <div
          style={{
            background: "#fff",
            border: "2px solid var(--ink-900)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--ink-900)",
              color: "#fff",
              padding: "10px 16px",
              fontWeight: 800,
              fontSize: ".8125rem",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Payout history
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--line-100)" }}>
                {["Date", "Sold", "Fee", "Net", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: ".75rem",
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      color: "var(--ink-700)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "var(--ink-500)",
                      fontSize: ".875rem",
                    }}
                  >
                    No payouts yet. History appears here after your first sale.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const s = statusLabel[r.status as keyof typeof statusLabel];
                return (
                  <tr key={i} style={{ borderTop: "1.5px solid var(--line-200)" }}>
                    <td style={{ padding: "14px 12px", fontWeight: 700 }}>{r.date}</td>
                    <td className="tnum" style={{ padding: "14px 12px" }}>
                      Rs. {r.cash.toLocaleString("en-IN")}
                    </td>
                    <td className="tnum" style={{ padding: "14px 12px", color: "var(--danger)" }}>
                      − Rs. {r.fee.toLocaleString("en-IN")}
                    </td>
                    <td
                      className="tnum"
                      style={{ padding: "14px 12px", color: "var(--success)", fontWeight: 800 }}
                    >
                      Rs. {r.net.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: s.bg,
                          color: s.color,
                          fontWeight: 700,
                          fontSize: ".75rem",
                        }}
                      >
                        {s.en}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bz-no-print" style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <Button variant="ghost" full icon="image" onClick={saveAsPdf}>
            Save as PDF
          </Button>
          <Button variant="ghost" full icon="phone" onClick={talkToSupport}>
            Talk to support
          </Button>
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.7 Customer Chat ---------- */
function useChatMobile(bp = 720) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [bp]);
  return isMobile;
}

export function SellerChat({ buyerMode = false }: { buyerMode?: boolean }) {
  const { t } = useTranslation();
  const { toast } = useBz();
  const isMobile = useChatMobile();
  const { data: inbox, isLoading, isError, error } = useChatInbox();
  const { invalidateInbox, invalidateMessages } = useInvalidateChat();
  const chatThreads = useMemo(() => inbox?.threads ?? [], [inbox?.threads]);
  const chatQuickReplies = useMemo(() => inbox?.quickReplies ?? [], [inbox?.quickReplies]);
  const [active, setActive] = useState<ChatThread | null>(null);
  const [mobileInThread, setMobileInThread] = useState(false);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: msgPage,
    isLoading: msgsLoading,
    isError: msgsError,
    error: msgsLoadError,
    refetch: refetchMessages,
  } = useChatMessages(active?.id ?? null);

  useEffect(() => {
    if (isMobile || !chatThreads.length || active) return;
    setActive(chatThreads[0] ?? null);
  }, [chatThreads, active, isMobile]);

  useEffect(() => {
    if (!buyerMode || typeof sessionStorage === "undefined") return;
    const sellerId = sessionStorage.getItem("bz_open_chat_seller");
    if (!sellerId) return;
    sessionStorage.removeItem("bz_open_chat_seller");
    void chatApi
      .createConversation(sellerId)
      .then((thread) => {
        setActive(thread);
        setMobileInThread(true);
        void invalidateInbox();
      })
      .catch((e) => {
        toast(e instanceof Error ? e.message : "Could not open chat");
      });
  }, [buyerMode, invalidateInbox, toast]);

  useEffect(() => {
    if (msgPage?.messages) setMessages(msgPage.messages);
  }, [msgPage]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev.map((m) => (m.id === message.id ? message : m));
      }
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    connectChatSocket();
    return () => {
      disconnectChatSocket();
    };
  }, []);

  useEffect(() => {
    if (!active?.id) return;
    const socket = connectChatSocket();
    joinConversation(active.id);

    const onNew = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId !== active.id) return;
      appendMessage(payload.message);
      void invalidateInbox();
    };

    const onStatus = (payload: {
      conversationId: string;
      messageId: string;
      deliveredAt?: string;
      readAt?: string;
    }) => {
      if (payload.conversationId !== active.id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== payload.messageId || m.from !== "me") return m;
          if (payload.readAt) return { ...m, status: "read" };
          if (payload.deliveredAt) return { ...m, status: "delivered" };
          return m;
        }),
      );
    };

    const onTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== active.id) return;
      if (payload.userId === active.peerUserId) setPeerTyping(payload.isTyping);
    };

    const onInbox = () => {
      void invalidateInbox();
    };

    const onPresence = (payload: { userId: string; isOnline: boolean; lastSeenAt: string }) => {
      if (payload.userId !== active.peerUserId) return;
      setActive((cur) =>
        cur
          ? {
              ...cur,
              isOnline: payload.isOnline,
              lastSeenLabel: payload.isOnline
                ? "Online"
                : `Last seen ${new Date(payload.lastSeenAt).toLocaleTimeString()}`,
            }
          : cur,
      );
    };

    socket.on("message_new", onNew);
    socket.on("message_status", onStatus);
    socket.on("typing", onTyping);
    socket.on("inbox_updated", onInbox);
    socket.on("presence_broadcast", onPresence);

    return () => {
      leaveConversation(active.id);
      socket.off("message_new", onNew);
      socket.off("message_status", onStatus);
      socket.off("typing", onTyping);
      socket.off("inbox_updated", onInbox);
      socket.off("presence_broadcast", onPresence);
      setPeerTyping(false);
    };
  }, [active?.id, active?.peerUserId, appendMessage, invalidateInbox]);

  const notifyTyping = useCallback(() => {
    if (!active?.id) return;
    emitTypingStart(active.id);
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      emitTypingStop(active.id);
    }, 1500);
  }, [active?.id]);

  const send = async (text: string, attachment?: ChatMessage["attachment"]) => {
    if (!active?.id) {
      toast("Select a conversation first");
      return;
    }
    if (sending) return;
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;

    const clientMessageId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const messageType = attachment?.mediaType ?? "text";
    const optimistic: ChatMessage = {
      id: clientMessageId,
      from: "me",
      text: trimmed || (messageType === "image" ? "Photo" : messageType === "video" ? "Video" : ""),
      t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messageType,
      attachment,
      status: "sent",
      createdAt: new Date().toISOString(),
      senderUserId: "",
    };

    appendMessage(optimistic);
    setMsg("");
    emitTypingStop(active.id);
    setSending(true);

    try {
      const sent = await sendChatMessage(active.id, {
        body: trimmed || undefined,
        clientMessageId,
        attachment: attachment
          ? {
              url: attachment.url,
              thumbnailUrl: attachment.thumbnailUrl ?? undefined,
              mimeType: attachment.mimeType,
              mediaType: attachment.mediaType as "image" | "video",
            }
          : undefined,
      });
      setMessages((prev) => prev.map((m) => (m.id === clientMessageId ? sent : m)));
      void invalidateInbox();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== clientMessageId));
      toast(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const onPickMedia = async (file: File) => {
    if (!active?.id) return;
    const isVideo = file.type.startsWith("video/");
    const allowedImage = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideo = ["video/mp4", "video/quicktime", "video/webm"];
    if (!isVideo && !allowedImage.includes(file.type)) {
      toast("Use JPEG, PNG, or WebP images");
      return;
    }
    if (isVideo && !allowedVideo.includes(file.type)) {
      toast("Use MP4, MOV, or WebM videos");
      return;
    }
    setSending(true);
    try {
      const uploaded = isVideo ? await chatApi.uploadVideo(file) : await chatApi.uploadImage(file);
      await send("", {
        url: uploaded.url,
        thumbnailUrl: "thumbnailUrl" in uploaded ? (uploaded.thumbnailUrl as string) : uploaded.url,
        mediaType: isVideo ? "video" : "image",
        mimeType: file.type,
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (isLoading || isError) {
    return (
      <ApiState isLoading={isLoading} isError={isError} error={error}>
        <div />
      </ApiState>
    );
  }

  if (!chatThreads.length) {
    return (
      <div className="bz-chat-page">
        {!buyerMode ? <SellerHelpBar /> : null}
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          {buyerMode ? "Messages" : "Messages"}
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {buyerMode
            ? "Chat directly with sellers about products and orders."
            : "Reply fast. Buyers who wait > 1hr usually leave."}
        </p>
        <EmptyState
          title="No conversations yet"
          message="When buyers message you, chats will appear here."
        />
      </div>
    );
  }

  const showMobileThread = isMobile && mobileInThread && active;

  if (!active && !isMobile) {
    return (
      <ApiState isLoading>
        <div />
      </ApiState>
    );
  }

  return (
    <div className="bz-chat-page">
      {!buyerMode ? <SellerHelpBar /> : null}
      <div
        className="bz-chat-page__head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            {buyerMode ? t("seller.chat.titleBuyer") : t("seller.chat.title")}
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
            {buyerMode ? t("seller.chat.subtitleBuyer") : t("seller.chat.subtitleSeller")}
          </p>
        </div>
        {!buyerMode ? (
          <Button
            variant="secondary"
            icon="edit"
            size="sm"
            onClick={() => toast("Edit quick replies — coming soon")}
          >
            Edit quick replies
          </Button>
        ) : null}
      </div>

      <div className={`bz-chat-shell${showMobileThread ? " bz-chat-shell--in-thread" : ""}`}>
        {/* Threads list */}
        <aside className="bz-chat-shell__threads">
          {chatThreads.map((t) => {
            const sel = active?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActive(t);
                  setMessages([]);
                  setPeerTyping(false);
                  if (isMobile) setMobileInThread(true);
                }}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  background: sel ? "var(--tint-blue-50)" : "#fff",
                  border: "none",
                  borderBottom: "1px solid var(--line-200)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <BuyerAvatar
                  src={t.avatarUrl}
                  name={t.buyer}
                  size={40}
                  fontSize=".875rem"
                  style={{
                    background: TINTS[t.tone as keyof typeof TINTS][0],
                    color: TINTS[t.tone as keyof typeof TINTS][2],
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: ".875rem",
                        color: "var(--ink-900)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.buyer}
                    </div>
                    <div style={{ fontSize: ".7rem", color: "var(--ink-400)" }}>{t.time}</div>
                  </div>
                  <div
                    style={{
                      fontSize: ".75rem",
                      color: "var(--ink-500)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.last}
                  </div>
                </div>
                {t.unread > 0 && (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      background: "var(--danger)",
                      color: "#fff",
                      fontSize: ".68rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {t.unread}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Conversation */}
        {active ? (
          <div className="bz-chat-shell__panel">
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line-200)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setMobileInThread(false)}
                  aria-label="Back to conversations"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1.5px solid var(--line-200)",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="arrowLeft" size={18} color="var(--ink-700)" />
                </button>
              ) : null}
              <BuyerAvatar
                src={active.avatarUrl}
                name={active.buyer}
                size={36}
                fontSize=".875rem"
                style={{
                  background: TINTS[active.tone as keyof typeof TINTS][0],
                  color: TINTS[active.tone as keyof typeof TINTS][2],
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: ".9375rem" }}>{active.buyer}</div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  {peerTyping
                    ? `${active.buyer} is typing...`
                    : `${active.city} · ${active.lastSeenLabel}`}
                </div>
              </div>
              <a
                href="tel:98XXXXXXXX"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#16a34a",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <Icon name="phone" size={18} color="#fff" />
              </a>
            </div>

            <div className="bz-chat-shell__messages">
              {msgsLoading && !messages.length ? (
                <div style={{ textAlign: "center", color: "var(--ink-400)", fontSize: ".8125rem" }}>
                  Loading messages...
                </div>
              ) : null}
              {msgsError && !messages.length ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--ink-500)",
                    fontSize: ".8125rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    {msgsLoadError instanceof Error
                      ? msgsLoadError.message
                      : "Could not load messages"}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => void refetchMessages()}>
                    Retry
                  </Button>
                </div>
              ) : null}
              {!msgsLoading && !msgsError && !messages.length ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--ink-400)",
                    fontSize: ".8125rem",
                  }}
                >
                  No messages yet. Say hello.
                </div>
              ) : null}
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.from === "me" ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      background: m.from === "me" ? "var(--blue)" : "#fff",
                      color: m.from === "me" ? "#fff" : "var(--ink-900)",
                      borderRadius: m.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      fontSize: ".875rem",
                      border: m.from === "me" ? "none" : "1px solid var(--line-200)",
                    }}
                  >
                    {m.attachment?.mediaType === "image" ? (
                      <a href={m.attachment.url} download target="_blank" rel="noopener noreferrer">
                        <img
                          src={m.attachment.thumbnailUrl || m.attachment.url}
                          alt=""
                          style={{ maxWidth: "100%", borderRadius: 8, display: "block" }}
                        />
                      </a>
                    ) : m.attachment?.mediaType === "video" ? (
                      <video
                        src={m.attachment.url}
                        controls
                        style={{ maxWidth: "100%", borderRadius: 8, display: "block" }}
                      />
                    ) : null}
                    {m.text && m.messageType === "text" ? m.text : null}
                    {m.text && m.messageType !== "text" ? (
                      <div style={{ marginTop: m.attachment ? 6 : 0, fontSize: ".8125rem" }}>
                        {m.text}
                      </div>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: ".65rem",
                      color: "var(--ink-400)",
                      marginTop: 2,
                      textAlign: m.from === "me" ? "right" : "left",
                      display: "flex",
                      gap: 6,
                      justifyContent: m.from === "me" ? "flex-end" : "flex-start",
                    }}
                  >
                    <span>{m.t}</span>
                    {m.from === "me" && m.status ? (
                      <span>
                        {m.status === "read"
                          ? "Read"
                          : m.status === "delivered"
                            ? "Delivered"
                            : "Sent"}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick replies */}
            <div className="bz-chat-shell__quick">
              {chatQuickReplies.map((q) => (
                <button
                  key={q.en}
                  onClick={() => void send(q.en)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    background: "var(--tint-blue-50)",
                    border: "1px solid var(--blue)",
                    color: "var(--blue)",
                    borderRadius: 999,
                    fontSize: ".75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {q.en}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="bz-chat-shell__composer">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onPickMedia(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={sending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1.5px solid var(--line-200)",
                  cursor: sending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Attach media"
              >
                <Icon name="image" size={20} color="var(--ink-500)" />
              </button>
              <input
                type="text"
                className="bz-chat-shell__composer-input"
                value={msg}
                onChange={(e) => {
                  setMsg(e.target.value);
                  notifyTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(msg);
                  }
                }}
                placeholder="Type a message"
                disabled={sending}
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => void send(msg)}
                disabled={!msg.trim() || sending}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: msg.trim() && !sending ? "var(--red)" : "var(--line-200)",
                  color: "#fff",
                  border: "none",
                  cursor: msg.trim() && !sending ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="arrowRight" size={20} color="#fff" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function fmtRs(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "0";
}

function bargainStatus(o: {
  status?: string;
  accepted?: boolean;
  rejected?: boolean;
}): "accepted" | "rejected" | "pending" {
  if (o.status === "accepted" || o.accepted) return "accepted";
  if (o.status === "rejected" || o.rejected) return "rejected";
  return "pending";
}

/* ---------- 4.8 Bargaining ---------- */
export function SellerBargain() {
  const { t } = useTranslation();
  const { toast } = useBz();
  const { data: BARGAIN_OFFERS = [], isLoading, isError, error } = useSellerBargains();
  const acceptMutation = useAcceptBargainOffer();
  const rejectMutation = useRejectBargainOffer();
  const counterMutation = useCounterBargainOffer();

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          {t("seller.bargain.title")}
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {t("seller.bargain.subtitle")}
        </p>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {(() => {
            const offers = BARGAIN_OFFERS as Array<{
              status?: string;
              accepted?: boolean;
              rejected?: boolean;
              listed?: number;
              offered?: number;
              yourOffer?: number;
            }>;
            const total = offers.length;
            const accepted = offers.filter((o) => bargainStatus(o) === "accepted").length;
            const acceptPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
            // Bargaining is amount-based — the saving is what the buyer knocked off
            // the listed price (Rs.), not a percentage.
            const savings = offers
              .map((o) => Math.max(0, Number(o.listed) - Number(o.offered ?? o.yourOffer ?? 0)))
              .filter((s) => s > 0);
            const avgSaving = savings.length
              ? Math.round(savings.reduce((a, b) => a + b, 0) / savings.length)
              : 0;
            const margin = offers
              .filter((o) => bargainStatus(o) === "accepted")
              .reduce(
                (sum, o) =>
                  sum + Math.max(0, Number(o.listed) - Number(o.offered ?? o.yourOffer ?? 0)),
                0,
              );
            return [
              { v: String(total), k: "Offers this week", c: "var(--blue)" },
              { v: total > 0 ? `${acceptPct}%` : "0%", k: "You accepted", c: "var(--success)" },
              {
                v: `Rs. ${avgSaving.toLocaleString("en-IN")}`,
                k: "Average saving",
                c: "var(--saffron)",
              },
              { v: `Rs. ${margin.toLocaleString("en-IN")}`, k: "Margin given", c: "var(--danger)" },
            ];
          })().map((s) => (
            <div
              key={s.k}
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div className="tnum" style={{ fontSize: "1.375rem", fontWeight: 800, color: s.c }}>
                {s.v}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>

        {/* Offers */}
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          Offers
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BARGAIN_OFFERS.map((o) => {
            const status = bargainStatus(o);
            const listed = Number(o.listed) || 0;
            const offered = Number(o.offered ?? o.yourOffer) || 0;
            const saving = Math.max(0, listed - offered);
            return (
              <div
                key={o.id}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${status === "pending" ? "var(--red)" : "var(--line-200)"}`,
                  borderRadius: "var(--r-lg)",
                  padding: 14,
                  display: "flex",
                  gap: 12,
                }}
              >
                <BuyerAvatar
                  src={o.buyerAvatarUrl}
                  name={o.buyer}
                  size={56}
                  fontSize="1.25rem"
                  style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    {status === "pending" && (
                      <Chip tone="red" size="sm" icon="bargain">
                        New offer
                      </Chip>
                    )}
                    {status === "accepted" && (
                      <Chip tone="success" size="sm" icon="check">
                        Accepted
                      </Chip>
                    )}
                    {status === "rejected" && (
                      <Chip tone="danger" size="sm" icon="x">
                        Rejected
                      </Chip>
                    )}
                    <span
                      style={{ fontSize: ".7rem", color: "var(--ink-400)", marginLeft: "auto" }}
                    >
                      {o.time}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800 }}>
                    {o.buyer} · {o.city}
                  </div>
                  <div style={{ fontSize: ".8125rem", color: "var(--ink-700)", marginTop: 2 }}>
                    {o.product}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 6,
                      fontSize: ".875rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      Listed:{" "}
                      <span
                        className="tnum"
                        style={{ textDecoration: "line-through", color: "var(--ink-500)" }}
                      >
                        Rs. {fmtRs(listed)}
                      </span>
                    </span>
                    <span>
                      Offer:{" "}
                      <span className="tnum" style={{ fontWeight: 800, color: "var(--blue-deep)" }}>
                        Rs. {fmtRs(offered)}
                      </span>
                    </span>
                    <span className="tnum" style={{ color: "var(--saffron)", fontWeight: 700 }}>
                      −Rs. {fmtRs(saving)}
                    </span>
                  </div>
                  {status === "pending" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await acceptMutation.mutateAsync(o.id);
                            toast("Offer accepted");
                          } catch {
                            toast("Could not accept offer");
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const mid = Math.round((o.listed + o.offered) / 2 / 10) * 10;
                          try {
                            await counterMutation.mutateAsync({ id: o.id, counter: mid });
                            toast("Counter offer sent");
                          } catch {
                            toast("Could not send counter");
                          }
                        }}
                      >
                        Counter
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          try {
                            await rejectMutation.mutateAsync(o.id);
                            toast("Offer rejected");
                          } catch {
                            toast("Could not reject offer");
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.9 Promotions (removed) ---------- */
export function SellerPromotions() {
  const { nav } = useBz();
  useEffect(() => {
    nav("s-dashboard");
  }, [nav]);
  return null;
}

/* ---------- 4.10 Reviews ---------- */
export function SellerReviews() {
  const { t } = useTranslation();
  const { toast } = useBz();
  const { data: REVIEWS_DATA = [], isLoading, isError, error } = useSellerReviews();
  const [filter, setFilter] = useState("all");
  const list = REVIEWS_DATA.filter(
    (r) =>
      filter === "all" ||
      (filter === "unreplied" && !r.replied) ||
      (filter === "low" && r.stars <= 3),
  );
  const avg = REVIEWS_DATA.length
    ? (REVIEWS_DATA.reduce((s, r) => s + r.stars, 0) / REVIEWS_DATA.length).toFixed(1)
    : "0.0";

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          {t("seller.reviews.title")}
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          {t("seller.reviews.subtitle")}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            { v: `${avg} ★`, k: "Average", c: "var(--gold)" },
            { v: REVIEWS_DATA.length, k: "Total", c: "var(--blue)" },
            { v: REVIEWS_DATA.filter((r) => !r.replied).length, k: "Needs reply", c: "var(--red)" },
            {
              v: REVIEWS_DATA.filter((r) => r.stars <= 3).length,
              k: "Low ratings",
              c: "var(--danger)",
            },
          ].map((s) => (
            <div
              key={s.k}
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 14,
              }}
            >
              <div className="tnum" style={{ fontSize: "1.375rem", fontWeight: 800, color: s.c }}>
                {s.v}
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>{s.k}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <ChipGroup
            options={[
              { value: "all", label: "All" },
              { value: "unreplied", label: "Needs reply" },
              { value: "low", label: "Low (≤ 3★)" },
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                border: `1.5px solid ${r.low ? "var(--danger)" : "var(--line-200)"}`,
                borderRadius: "var(--r-lg)",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <BuyerAvatar
                  src={r.avatar}
                  name={r.buyer}
                  size={36}
                  fontSize=".875rem"
                  style={{ background: "var(--tint-blue-50)", color: "var(--blue)" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{r.buyer}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                    {r.product} · {r.time}
                  </div>
                </div>
                <RatingStars value={r.stars} />
              </div>
              <p style={{ margin: "8px 0", color: "var(--ink-700)", fontSize: ".9375rem" }}>
                {r.text}
              </p>
              {r.replied ? (
                <div
                  style={{
                    marginTop: 8,
                    padding: 10,
                    background: "var(--line-100)",
                    borderRadius: "var(--r-md)",
                    borderLeft: "3px solid var(--blue)",
                  }}
                >
                  <div
                    style={{
                      fontSize: ".7rem",
                      color: "var(--blue)",
                      fontWeight: 800,
                      marginBottom: 2,
                    }}
                  >
                    Your reply
                  </div>
                  <div style={{ fontSize: ".875rem", color: "var(--ink-700)" }}>{r.reply}</div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Button variant="primary" size="sm" onClick={() => toast("Reply sent")}>
                    Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="flag"
                    onClick={() => toast("Reported to BazaarCo")}
                  >
                    Report
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.11 Storefront builder ---------- */
export function SellerStorefront() {
  const { t } = useTranslation();
  const { toast } = useBz();
  const { data: storefront, isLoading, isError, error } = useSellerStorefront();
  const updateStorefront = useUpdateStorefront();
  const uploadLogo = useUploadStorefrontLogo();
  const removeLogo = useRemoveStorefrontLogo();
  const uploadBanner = useUploadStorefrontBanner();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoCropUrl, setLogoCropUrl] = useState<string | null>(null);
  const [about, setAbout] = useState("");
  const [shopName, setShopName] = useState("");
  const [storeAddress, setStoreAddress] = useState<StoreAddress>(emptyStoreAddress);

  useEffect(() => {
    if (!storefront) return;
    setAbout(storefront.about ?? "");
    setShopName(storefront.shopName ?? "");
    setStoreAddress(
      storefront.storeAddress ?? {
        city: storefront.city ?? "",
        area: "",
        landmark: "",
        lat: null,
        lng: null,
      },
    );
  }, [storefront]);

  const logoUrl = storefront?.logoUrl;
  const bannerUrl = storefront?.bannerUrl;
  const busy =
    updateStorefront.isPending ||
    uploadLogo.isPending ||
    removeLogo.isPending ||
    uploadBanner.isPending;

  const handleRemoveLogo = async () => {
    try {
      await removeLogo.mutateAsync();
      toast("Logo removed");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove logo");
    }
  };

  const revokeObjectUrl = (url: string | null) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  };

  const pickImage = async (file: File, kind: "logo" | "banner") => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast("Use JPEG, PNG, or WebP");
      return;
    }
    if (kind === "logo") {
      revokeObjectUrl(logoCropUrl);
      setLogoCropUrl(URL.createObjectURL(file));
      return;
    }
    try {
      await uploadBanner.mutateAsync(file);
      toast("Banner updated");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const closeLogoCrop = () => {
    revokeObjectUrl(logoCropUrl);
    setLogoCropUrl(null);
  };

  const saveLogoCrop = async (file: File) => {
    closeLogoCrop();
    try {
      await uploadLogo.mutateAsync(file);
      toast("Logo updated");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const publish = async () => {
    const trimmedName = shopName.trim();
    if (trimmedName.length < 2) {
      toast("Store name is required");
      return;
    }
    const city = storeAddress.city?.trim();
    if (!city) {
      toast("Store address is required");
      return;
    }
    try {
      await updateStorefront.mutateAsync({
        about,
        shopName: trimmedName,
        storeAddress: {
          city,
          ...(storeAddress.area?.trim() ? { area: storeAddress.area.trim() } : {}),
          ...(storeAddress.landmark?.trim() ? { landmark: storeAddress.landmark.trim() } : {}),
          ...(storeAddress.lat != null ? { lat: storeAddress.lat } : {}),
          ...(storeAddress.lng != null ? { lng: storeAddress.lng } : {}),
        },
      });
      toast("Storefront published — buyers see it now");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save storefront");
    }
  };

  const isSetupRequired =
    isError && error instanceof ApiRequestError && error.errors.includes("SELLER_SETUP_REQUIRED");

  if (isSetupRequired) {
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            minHeight: 320,
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--brand-50, #fef3c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🏪
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--ink-900)",
            }}
          >
            Set up your shop first
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: ".9375rem",
              color: "var(--ink-500)",
              maxWidth: 380,
              lineHeight: 1.5,
            }}
          >
            Complete seller onboarding to register your organisation before you can customise your
            storefront.
          </p>
          <AppLink
            href={pathFromScreen("s-onboarding")}
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "10px 24px",
              background: "var(--brand)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              fontWeight: 700,
              fontSize: ".9375rem",
              textDecoration: "none",
            }}
          >
            Go to onboarding
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      {logoCropUrl ? (
        <ImageCropModal
          objectUrl={logoCropUrl}
          aspectRatio={1}
          outputWidth={512}
          outputHeight={512}
          maskShape="circle"
          showBrightness={false}
          title="Crop shop logo"
          subtitle="Drag and zoom to fit your logo inside the circle"
          confirmLabel="Save logo"
          fileNamePrefix="shop-logo"
          onCancel={closeLogoCrop}
          onConfirm={(file) => void saveLogoCrop(file)}
        />
      ) : null}
      <div
        className="bz-container-pad"
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          padding: "20px clamp(14px, 4vw, 28px) 100px",
        }}
      >
        <SellerHelpBar />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
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
              {t("seller.storefront.title")}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: ".875rem", color: "var(--ink-500)" }}>
              Customize how buyers see your shop.
            </p>
          </div>
          <Button variant="primary" disabled={busy} onClick={() => void publish()}>
            {updateStorefront.isPending ? "Publishing…" : "Publish"}
          </Button>
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickImage(file, "logo");
            e.target.value = "";
          }}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickImage(file, "banner");
            e.target.value = "";
          }}
        />

        {/* Live preview card */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          {/* Banner */}
          <div
            style={{
              position: "relative",
              height: "clamp(100px, 20vw, 160px)",
              background: "var(--line-100)",
            }}
          >
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="image" size={32} color="var(--ink-300)" />
              </div>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => bannerInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: "var(--r-md)",
                background: "rgba(255,255,255,.9)",
                border: "1px solid var(--line-200)",
                fontWeight: 700,
                fontSize: ".75rem",
                cursor: "pointer",
                color: "var(--ink-700)",
              }}
            >
              <Icon name="image" size={14} color="var(--ink-600)" />
              {uploadBanner.isPending ? "Uploading…" : "Change banner"}
            </button>
          </div>

          {/* Logo + name row — logo overlaps banner; name reserves space via paddingLeft */}
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ position: "relative", minHeight: 40 }}>
              <div style={{ position: "absolute", left: 0, top: -36, zIndex: 1 }}>
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid #fff",
                        boxShadow: "0 2px 8px rgba(0,0,0,.1)",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "var(--line-100)",
                        border: "3px solid #fff",
                        boxShadow: "0 2px 8px rgba(0,0,0,.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="store" size={28} color="var(--ink-300)" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Change logo"
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1.5px solid var(--line-200)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="edit" size={13} color="var(--ink-600)" />
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingLeft: 86,
                  paddingTop: 8,
                  paddingBottom: 4,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1.125rem",
                      color: "var(--ink-900)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {shopName || "Your store name"}
                  </div>
                  {formatStoreAddress(storeAddress, storefront?.city) && (
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}>
                      {formatStoreAddress(storeAddress, storefront?.city)}
                    </div>
                  )}
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRemoveLogo()}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--ink-400)",
                      fontSize: ".75rem",
                      fontWeight: 600,
                      textDecoration: "underline",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {removeLogo.isPending ? "Removing…" : "Remove logo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 20,
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-600)",
                marginBottom: 8,
              }}
            >
              Store name
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Bhaktapur Handicraft"
              maxLength={256}
              style={{
                width: "100%",
                height: 44,
                padding: "0 12px",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-sans)",
                fontSize: ".9375rem",
                outline: "none",
              }}
            />
            <p style={{ margin: "8px 0 0", fontSize: ".75rem", color: "var(--ink-400)" }}>
              Visible to buyers on your store page and product listings.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 20,
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-600)",
                marginBottom: 8,
              }}
            >
              {t("seller.storeAddress")}
            </label>
            <p style={{ margin: "0 0 10px", fontSize: ".75rem", color: "var(--ink-500)" }}>
              {t("seller.storeAddressHint")}
            </p>
            <LandmarkAddress value={storeAddress} onChange={setStoreAddress} />
            <label
              style={{
                display: "block",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-600)",
                marginBottom: 8,
                marginTop: 18,
              }}
            >
              About your store
            </label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell buyers your story..."
              style={{
                width: "100%",
                minHeight: 100,
                padding: 12,
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-sans)",
                fontSize: ".875rem",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.12 Videos ---------- */
export function SellerVideos() {
  const { t } = useTranslation();
  const { toast, nav } = useBz();
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const vStatus = verification?.status ?? "none";
  const canSell = verification?.canSell === true;
  const { data: videosData, isLoading, isError, error, refetch } = useSellerVideos();
  const videos = videosData?.items ?? [];
  const videoAnalytics = videosData?.analytics;
  const [showUpload, setShowUpload] = useState(false);

  if (!canSell) {
    // The global verification banner (seller shell) already explains the status.
    // Keep the page body to a single calm line instead of a duplicate card.
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--ink-600)",
          }}
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
              marginBottom: 12,
            }}
          >
            <Icon name="video" size={32} color="var(--ink-400)" />
          </div>
          <p style={{ margin: 0, fontSize: ".9375rem", fontWeight: 600, maxWidth: 320 }}>
            {t("seller.videos.verifyRequired")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
        className="bz-container-pad"
        style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
      >
        <SellerHelpBar />
        <SellerVideoLibrary
          videos={videos}
          analytics={videoAnalytics}
          showUpload={showUpload}
          onToggleUpload={() => setShowUpload((s) => !s)}
          onRefetch={() => void refetch()}
          onToast={toast}
        />
      </div>
    </ApiState>
  );
}

/* Reports/KYC/Notifications removed — merged into Analytics/Profile/Settings */

/* ---------- 4.17 Settings (includes Notifications) ---------- */
export const NOTIF_EVENTS = [
  {
    id: "new_order",
    labelKey: "seller.settings.events.newOrder",
    defaults: [true, true, true, false],
  },
  {
    id: "bargain",
    labelKey: "seller.settings.events.bargainOffer",
    defaults: [true, false, true, false],
  },
  {
    id: "low_stock",
    labelKey: "seller.settings.events.lowStock",
    defaults: [true, false, true, false],
  },
  {
    id: "new_review",
    labelKey: "seller.settings.events.newReview",
    defaults: [true, false, false, false],
  },
  {
    id: "payout",
    labelKey: "seller.settings.events.payoutSent",
    defaults: [true, true, true, true],
  },
  {
    id: "policy",
    labelKey: "seller.settings.events.policyUpdate",
    defaults: [true, false, false, true],
  },
];
export const NOTIF_CHANNELS = [
  { id: "in_app", labelKey: "seller.settings.channels.inApp", icon: "bell" },
  { id: "sms", labelKey: "seller.settings.channels.sms", icon: "message" },
  { id: "whatsapp", labelKey: "seller.settings.channels.whatsapp", icon: "headphones" },
  { id: "email", labelKey: "seller.settings.channels.email", icon: "file" },
];

/* ---------- KYC verification timeline ----------
   Always reachable from the sidebar so sellers who deferred KYC ("verify
   later") can come back and finish / track it. Renders the verification
   journey as a vertical timeline with event names + timestamps. */
export function SellerVerificationTimeline() {
  const { t } = useTranslation();
  const { nav } = useBz();
  const { data: organization, isLoading, isError, error } = useSellerOrganization();
  const verification = organization?.verification;
  const status = verification?.status ?? "none";

  const formatWhen = (iso: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const submitted = status !== "none";
  const reviewed = status === "approved" || status === "rejected";

  const STATUS_META = {
    none: { label: t("seller.kyc.statusNotStarted"), bg: "var(--line-200)", fg: "var(--ink-600)" },
    pending: {
      label: t("seller.kyc.statusPending"),
      bg: "rgba(247,127,0,.14)",
      fg: "var(--saffron)",
    },
    approved: {
      label: t("seller.kyc.statusApproved"),
      bg: "rgba(22,163,74,.14)",
      fg: "var(--success)",
    },
    rejected: { label: t("seller.kyc.statusRejected"), bg: "var(--tint-red-50)", fg: "var(--red)" },
  };
  const meta = STATUS_META[status] ?? STATUS_META.none;

  const milestones = [
    {
      key: "submitted",
      icon: "file",
      en: "KYC application submitted",
      at: verification?.submittedAt,
      state: submitted ? "done" : "todo",
      hint: submitted ? null : "You haven't sent your document yet.",
    },
    {
      key: "review",
      icon: reviewed ? "shieldCheck" : "clock",
      en: reviewed ? "Reviewed by BazaarCo" : "Under review by BazaarCo",
      at: reviewed ? verification?.reviewedAt : null,
      state: reviewed ? "done" : submitted ? "current" : "todo",
      hint: status === "pending" ? "Usually decided within 1–2 working days." : null,
    },
    {
      key: "decision",
      icon: status === "rejected" ? "x" : "badgeCheck",
      en:
        status === "approved"
          ? "Approved — you can sell"
          : status === "rejected"
            ? "Not approved"
            : "Approval",
      at: reviewed ? verification?.reviewedAt : null,
      state: status === "approved" ? "done" : status === "rejected" ? "done-red" : "todo",
      note: status === "rejected" ? verification?.note : null,
    },
  ];

  const dotFor = (state: string) => {
    switch (state) {
      case "done":
        return { bg: "rgba(22,163,74,.12)", fg: "var(--success)" };
      case "done-red":
        return { bg: "var(--tint-red-50)", fg: "var(--red)" };
      case "current":
        return { bg: "rgba(247,127,0,.14)", fg: "var(--saffron)" };
      default:
        return { bg: "var(--line-200)", fg: "var(--ink-400)" };
    }
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <SellerHelpBar />
        <div style={{ maxWidth: 640 }}>
          {/* Header — title + live status pill, wraps on narrow screens */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                }}
              >
                {t("seller.kyc.title")}
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: ".875rem", color: "var(--ink-500)" }}>
                Track your document verification status.
              </p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: meta.bg,
                color: meta.fg,
                fontWeight: 800,
                fontSize: ".8125rem",
                padding: "6px 12px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {meta.label}
            </span>
          </div>

          {/* Vertical timeline */}
          <div
            style={{
              marginTop: 18,
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: "22px 20px",
            }}
          >
            {milestones.map((m, i) => {
              const dot = dotFor(m.state);
              const last = i === milestones.length - 1;
              const when = formatWhen(m.at ?? "");
              const dim = m.state === "todo";
              return (
                <div key={m.key} style={{ display: "flex", gap: 14 }}>
                  {/* rail: dot + connector line */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: dot.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={m.icon} size={19} color={dot.fg} />
                    </div>
                    {!last && (
                      <div
                        style={{
                          flex: 1,
                          width: 2,
                          minHeight: 26,
                          margin: "4px 0",
                          background:
                            m.state === "todo" ? "var(--line-200)" : "rgba(22,163,74,.35)",
                        }}
                      />
                    )}
                  </div>
                  {/* content */}
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 20 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: ".9375rem",
                        color: dim ? "var(--ink-500)" : "var(--ink-900)",
                      }}
                    >
                      {m.en}
                    </div>
                    {when ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 6,
                          fontSize: ".8125rem",
                          color: "var(--ink-600)",
                          fontWeight: 600,
                        }}
                      >
                        <Icon name="clock" size={13} color="var(--ink-400)" />
                        <span className="tnum">{when}</span>
                      </div>
                    ) : m.state === "current" ? (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: ".8125rem",
                          color: "var(--saffron)",
                          fontWeight: 700,
                        }}
                      >
                        In progress
                      </div>
                    ) : null}
                    {m.hint && (
                      <div style={{ marginTop: 4, fontSize: ".8125rem", color: "var(--ink-500)" }}>
                        {m.hint}
                      </div>
                    )}
                    {m.note && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "10px 12px",
                          background: "var(--tint-red-50)",
                          border: "1px solid rgba(230,57,70,.25)",
                          borderRadius: "var(--r-md)",
                          fontSize: ".8125rem",
                          color: "var(--red)",
                        }}
                      >
                        <strong>Reason:</strong> {m.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action — finish or re-submit depending on status */}
          {(status === "none" || status === "rejected") && (
            <div style={{ marginTop: 18 }}>
              <Button variant="primary" size="lg" full onClick={() => nav("s-onboarding")}>
                {status === "rejected" ? "Re-upload document" : "Start verification"}
              </Button>
            </div>
          )}
          {status === "approved" && (
            <div style={{ marginTop: 18 }}>
              <Button variant="primary" size="lg" full onClick={() => nav("s-dashboard")}>
                Open dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </ApiState>
  );
}

export function SellerSettings() {
  const { t } = useTranslation();
  const { toast, nav } = useBz();
  const user = useBazaarStore((s) => s.user);
  const { data: organization } = useSellerOrganization();
  // Account settings (password, email, language, delete) work without KYC, so the
  // page stays open for sellers who deferred onboarding. Only the alert matrix —
  // which needs an active store — is hidden until the org is linked.
  const orgLinked = organization?.linked === true;
  const { data: notifications } = useSellerNotifications();
  const { data: settings, isLoading, isError, error } = useSellerSettings(orgLinked);
  const updateSettings = useUpdateSellerSettings();
  const [tab, setTab] = useState("account");
  const [notif, setNotif] = useState<boolean[][] | null>(null);
  const [pwdResetOpen, setPwdResetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noPassword = user?.provider === "google";
  const pwdMode = noPassword ? "set" : "reset";

  useEffect(() => {
    if (!settings) return;
    setNotif(settings.alertMatrix.map((row) => [...row]));
  }, [settings]);

  const handleSave = async () => {
    if (!notif) return;
    try {
      await updateSettings.mutateAsync({
        alertMatrix: notif,
      });
      toast(t("seller.common.settingsSaved"));
    } catch (e) {
      toast(e instanceof Error ? e.message : t("seller.common.settingsSaveFailed"));
    }
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          {t("seller.settings.title")}
        </h1>
        {/* Tab bar — same underline pattern as PDP description/specs */}
        <div
          role="tablist"
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "2px solid var(--line-200)",
            marginBottom: 20,
            marginTop: 8,
          }}
        >
          {[
            { id: "account", labelKey: "seller.settings.tabAccount" },
            ...(orgLinked ? [{ id: "alerts", labelKey: "seller.settings.tabAlerts" }] : []),
          ].map((tabDef) => {
            const active = tab === tabDef.id;
            return (
              <button
                key={tabDef.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(tabDef.id)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${active ? "var(--red)" : "transparent"}`,
                  marginBottom: -2,
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontWeight: active ? 800 : 600,
                  fontSize: ".9375rem",
                  color: active ? "var(--red)" : "var(--ink-500)",
                  fontFamily: "var(--font-sans)",
                  transition:
                    "color var(--dur-standard) var(--ease), border-color var(--dur-standard) var(--ease)",
                }}
              >
                {t(tabDef.labelKey)}
              </button>
            );
          })}
        </div>

        {tab === "alerts" && notif && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: ".875rem", color: "var(--ink-500)" }}>
              {t("seller.settings.alertsHint")}
            </p>
            {(notifications?.items ?? []).length > 0 && (
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-lg)",
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: ".875rem", marginBottom: 10 }}>
                  {t("seller.settings.recentAlerts")}
                </div>
                {(notifications?.items ?? []).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "8px 0",
                      borderBottom: "1px solid var(--line-200)",
                      fontSize: ".8125rem",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{n.title}</div>
                    <div style={{ color: "var(--ink-500)" }}>
                      {n.body} · {n.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                overflow: "auto",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "var(--line-100)" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: ".7rem",
                        fontWeight: 700,
                        color: "var(--ink-500)",
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("seller.settings.tellMeAbout")}
                    </th>
                    {NOTIF_CHANNELS.map((c) => (
                      <th
                        key={c.id}
                        style={{
                          padding: "12px 12px",
                          fontSize: ".7rem",
                          fontWeight: 700,
                          color: "var(--ink-500)",
                          letterSpacing: ".06em",
                          textTransform: "uppercase",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name={c.icon} size={14} /> {t(c.labelKey)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIF_EVENTS.map((e, ri) => (
                    <tr key={e.id} style={{ borderTop: "1px solid var(--line-200)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700 }}>{t(e.labelKey)}</div>
                      </td>
                      {NOTIF_CHANNELS.map((_, ci) => (
                        <td key={ci} style={{ padding: "14px 12px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={notif[ri]?.[ci] ?? false}
                            disabled={ri === 0 && ci === 0}
                            onChange={() =>
                              setNotif((s) =>
                                s
                                  ? s.map((row, i) =>
                                      i === ri ? row.map((v, j) => (j === ci ? !v : v)) : row,
                                    )
                                  : s,
                              )
                            }
                            style={{
                              width: 20,
                              height: 20,
                              accentColor: "var(--red)",
                              cursor: ri === 0 && ci === 0 ? "not-allowed" : "pointer",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "account" && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            {[
              {
                id: "password",
                icon: "lock",
                title: noPassword
                  ? t("seller.settings.setPassword")
                  : t("seller.settings.resetPassword"),
                sub: noPassword
                  ? t("seller.settings.setPasswordSub")
                  : t("seller.settings.resetPasswordSub"),
                onAct: () => setPwdResetOpen(true),
                control: undefined,
              },
              {
                id: "email",
                icon: "mail",
                title: t("seller.settings.email"),
                sub: user?.email ?? "—",
                onAct: undefined,
                control: undefined,
              },
              {
                id: "language",
                icon: "globe",
                title: t("seller.language"),
                sub: t("seller.languageSub"),
                onAct: undefined,
                control: <LanguageToggle compact />,
              },
            ].map((r, i, a) => {
              const content = (
                <>
                  <Icon name={r.icon} size={22} color="var(--ink-700)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
                  </div>
                  {r.control
                    ? r.control
                    : r.onAct && <Icon name="chevronRight" size={18} color="var(--ink-400)" />}
                </>
              );
              const rowStyle: React.CSSProperties = {
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                background: "#fff",
                borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none",
              };
              return r.onAct ? (
                <button
                  key={r.id}
                  onClick={() => r.onAct?.()}
                  style={{ ...rowStyle, border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  {content}
                </button>
              ) : (
                <div key={r.id} style={rowStyle}>
                  {content}
                </div>
              );
            })}
          </div>
        )}

        {tab === "account" && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--danger)",
              borderRadius: "var(--r-lg)",
              padding: 16,
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Icon name="trash" size={22} color="var(--danger)" />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 800, color: "var(--danger)" }}>
                {t("seller.settings.deleteAccountTitle")}
              </div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
                {t("seller.settings.deleteAccountSub")}
              </div>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              {t("seller.common.deleteAccount")}
            </Button>
          </div>
        )}

        {tab === "alerts" && (
          <Button
            variant="primary"
            size="lg"
            full
            disabled={!notif || updateSettings.isPending}
            onClick={() => void handleSave()}
            style={{ marginTop: 18 }}
          >
            {updateSettings.isPending ? t("seller.common.saving") : t("seller.common.save")}
          </Button>
        )}

        <PasswordResetModal
          open={pwdResetOpen}
          onClose={() => setPwdResetOpen(false)}
          mode={pwdMode}
        />

        <SellerDeleteAccountModal open={confirmDelete} onClose={() => setConfirmDelete(false)} />
      </div>
    </ApiState>
  );
}

/* ---------- 4.18 Profile (includes KYC) ---------- */
export function SellerProfile() {
  const { t } = useTranslation();
  const { nav, toast } = useBz();
  const logoutMutation = useLogout();
  const updateProfile = useUpdateProfile();
  const user = useBazaarStore((s) => s.user);
  const { data: storefront } = useSellerStorefront();
  const shopName = (storefront as { shopName?: string })?.shopName?.trim() || "Your shop";
  const sellerName = displayName(user, "Seller");

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pwdResetOpen, setPwdResetOpen] = useState(false);
  const noPassword = user?.provider === "google";
  const pwdMode = noPassword ? "set" : "reset";

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmLogout(false);
        toast("Logged out");
        nav("home");
      },
    });
  };

  // Owner name is the account holder's name (User.name). Editable here; the
  // store name is edited from the Storefront page instead.
  const editOwnerName = async () => {
    if (updateProfile.isPending) return;
    const next = window.prompt("Owner name", user?.name ?? "")?.trim();
    if (!next || next === user?.name) return;
    if (next.length < 2) {
      toast("Enter your full name");
      return;
    }
    try {
      await updateProfile.mutateAsync({ name: next });
      toast("Owner name updated");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update name");
    }
  };

  return (
    <div
      className="bz-container-pad"
      style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}
    >
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        {t("seller.profile.title")}
      </h1>

      {/* Owner card */}
      <div
        style={{
          background: "#fff",
          border: "1.5px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--tint-red-50)",
            color: "var(--red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.5rem",
          }}
        >
          {userInitial(user)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "1.125rem" }}>{sellerName}</div>
          <div style={{ fontSize: ".875rem", color: "var(--ink-500)" }}>
            {shopName} · {user?.email ?? "—"}
          </div>
          <div style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 2 }}>
            Complete KYC to get verified
          </div>
        </div>
      </div>

      {/* My info */}
      <h2
        style={{
          margin: "10px 0 8px",
          fontSize: ".9375rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        My info
      </h2>
      <div
        style={{
          background: "#fff",
          border: "1.5px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {[
          { icon: "user", en: "Owner name", sub: sellerName, onAct: editOwnerName },
          { icon: "mail", en: "Email", sub: user?.email ?? "—", onAct: undefined },
          {
            icon: "lock",
            en: noPassword ? "Set a password" : "Reset password",
            sub: noPassword
              ? "Add a password to also sign in with email"
              : "Send a code to your email",
            onAct: () => setPwdResetOpen(true),
          },
        ].map((r, i, a) => (
          <button
            key={r.en}
            onClick={() => (r.onAct ? void r.onAct() : toast(`${r.en} can't be edited here`))}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 16,
              background: "#fff",
              border: "none",
              borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <Icon name={r.icon} size={22} color="var(--ink-700)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{r.en}</div>
              <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
            </div>
            <Icon name="chevronRight" size={18} color="var(--ink-400)" />
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" full onClick={() => setConfirmLogout(true)}>
          Log out
        </Button>
      </div>
      <button
        onClick={() => setConfirmDelete(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "center",
          gap: 5,
          background: "none",
          border: "none",
          padding: "4px 2px",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: 500,
          fontSize: ".75rem",
          color: "var(--ink-400)",
          opacity: 0.45,
          marginTop: 24,
          transition: "opacity .15s, color .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.7";
          e.currentTarget.style.color = "var(--danger)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.45";
          e.currentTarget.style.color = "var(--ink-400)";
        }}
      >
        Delete my account
      </button>

      <SellerDeleteAccountModal open={confirmDelete} onClose={() => setConfirmDelete(false)} />

      <PasswordResetModal
        open={pwdResetOpen}
        onClose={() => setPwdResetOpen(false)}
        mode={pwdMode}
      />

      <LogoutConfirmModal
        open={confirmLogout}
        pending={logoutMutation.isPending}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}

/* ---------- NEW: Simple Analytics ("My shop") for non-tech 40+ users ---------- */

export function SellerAnalytics() {
  const { t } = useTranslation();
  const { data: analytics, isLoading, isError, error } = useSellerAnalytics();
  const salesByDay = analytics?.salesByDay ?? [];
  const topProducts = analytics?.topProducts ?? [];
  const moneyBuckets = analytics?.moneyBuckets ?? [];
  const maxBucket = Math.max(...moneyBuckets.map((b: { v: number }) => b.v), 0) || 1;
  const soldToday = moneyBuckets.find((b: { en: string }) => b.en === "Sold today")?.v ?? 0;
  const withCourier = moneyBuckets.find((b: { en: string }) => b.en === "With courier")?.v ?? 0;
  const bestDay = salesByDay.reduce(
    (best: { label: string; value: number }, d: { label: string; value: number }) =>
      d.value > best.value ? d : best,
    { label: "—", value: 0 },
  );

  const cardStyle = {
    background: "#fff",
    border: "1.5px solid var(--line-200)",
    borderRadius: "var(--r-lg)",
    padding: 22,
    boxShadow: "var(--sh-1)",
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page">
        <SellerHelpBar />

        <div className="bz-seller-analytics-span-12" style={{ marginBottom: 18 }}>
          <h1
            style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}
          >
            {t("seller.analytics.title")}
          </h1>
        </div>

        <div className="bz-seller-analytics-layout">
          <div className="bz-seller-analytics-span-4" style={cardStyle}>
            <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-500)" }}>
              Today you sold
            </div>
            <div
              className="tnum bz-stat-xl"
              style={{
                fontWeight: 800,
                letterSpacing: "-.02em",
                margin: "6px 0 4px",
                color: "var(--blue-deep)",
              }}
            >
              Rs. {soldToday.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
              Courier holding Rs. {withCourier.toLocaleString("en-IN")}
            </div>
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid var(--line-200)",
                display: "grid",
                gap: 12,
              }}
            >
              {moneyBuckets.map((b) => (
                <div
                  key={b.en}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: ".8125rem", fontWeight: 500, color: "var(--ink-500)" }}>
                    {b.en}
                  </span>
                  <span className="tnum" style={{ fontWeight: 700, color: "var(--ink-900)" }}>
                    Rs. {b.v.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bz-seller-analytics-span-8" style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.125rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                  }}
                >
                  Shop snapshot
                </h2>
              </div>
              <div
                style={{
                  padding: "8px 14px",
                  background: "var(--tint-blue-50)",
                  borderRadius: 999,
                  fontSize: ".75rem",
                  fontWeight: 700,
                  color: "var(--blue-deep)",
                }}
              >
                Last 7 days
              </div>
            </div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: ".875rem",
                color: "var(--ink-600)",
                maxWidth: 560,
              }}
            >
              {bestDay.value > 0
                ? `${bestDay.label} was your strongest day — Rs. ${bestDay.value.toLocaleString("en-IN")} in sales.`
                : "Sales will show here once you start receiving orders."}
            </p>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
            >
              {[
                {
                  label: "7-day total",
                  value: `Rs. ${salesByDay.reduce((s, d) => s + d.value, 0).toLocaleString("en-IN")}`,
                },
                {
                  label: "Daily average",
                  value: `Rs. ${Math.round(salesByDay.reduce((s, d) => s + d.value, 0) / Math.max(salesByDay.length, 1)).toLocaleString("en-IN")}`,
                },
                { label: "Best day", value: bestDay.value > 0 ? bestDay.label : "—" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "12px 14px",
                    background: "var(--line-100)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--line-200)",
                  }}
                >
                  <div
                    style={{
                      fontSize: ".7rem",
                      fontWeight: 700,
                      color: "var(--ink-500)",
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="tnum"
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "var(--blue-deep)",
                      marginTop: 4,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bz-seller-analytics-span-8" style={cardStyle}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              Sales — last 7 days
            </h2>
            <SellerBarChart data={salesByDay} height={300} />
          </div>

          <div className="bz-seller-analytics-span-4" style={cardStyle}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              Where my money is
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {moneyBuckets.map((b) => {
                const pct = (b.v / maxBucket) * 100;
                return (
                  <div key={b.en}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{b.en}</span>
                      </div>
                      <span
                        className="tnum"
                        style={{ fontWeight: 800, fontSize: "1.05rem", color: b.c }}
                      >
                        Rs. {b.v.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 14,
                        background: "var(--line-100)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: b.c,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                marginTop: 14,
                padding: 10,
                background: "var(--tint-blue-50)",
                borderRadius: "var(--r-md)",
                fontSize: ".875rem",
                color: "var(--blue-deep)",
              }}
            >
              <Icon
                name="badgeCheck"
                size={14}
                color="var(--blue)"
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              {withCourier > 0
                ? `Rs. ${withCourier.toLocaleString("en-IN")} is with courier until delivery is confirmed.`
                : "No payouts in transit right now."}
            </p>
          </div>

          <div className="bz-seller-analytics-span-12" style={cardStyle}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              Your top 3 items this week
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topProducts.length === 0 && (
                <p style={{ margin: 0, color: "var(--ink-500)", fontSize: ".875rem" }}>
                  No sales yet this week.
                </p>
              )}
              {topProducts.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 12,
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--gold)" : "var(--line-200)",
                      color: i === 0 ? "#fff" : "var(--ink-700)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <Placeholder
                    icon={p.icon}
                    tint={p.tint}
                    style={{ width: 56, height: 56, flexShrink: 0 }}
                    radius="var(--r-sm)"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{p.name}</div>
                    <div
                      className="tnum"
                      style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}
                    >
                      {p.units} sold
                    </div>
                  </div>
                  <div
                    className="tnum"
                    style={{ fontWeight: 800, color: "var(--success)", fontSize: "1rem" }}
                  >
                    Rs. {p.rev.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ApiState>
  );
}
