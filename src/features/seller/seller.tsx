"use client";

import React, { useState, useEffect, Fragment, useRef, useCallback } from "react";
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
import { ProductPhotoPicker, type ProductPhoto } from "@/components/seller/product-photo-picker";
import { SellerVideoLibrary } from "@/components/seller/seller-video-library";
import {
  SellerVerificationBanner,
  SellerVerificationBlocked,
} from "@/components/seller/seller-verification-banner";
import {
  useCompleteOnboarding,
  useLogout,
  useCurrentUser,
  useUpdateProfile,
  useDeleteAccount,
} from "@/hooks/use-auth";
import { usePendingSellerVerifications, useReviewSellerVerification } from "@/hooks/use-admin";
import { useBazaarStore } from "@/store/bazaar-store";
import { displayName, userInitial } from "@/lib/display";
import { useCategories } from "@/hooks/use-catalog";
import { useUploadImage } from "@/hooks/use-media-upload";
import {
  useCreateProduct,
  useSellerDashboard,
  useSellerInbox,
  useSellerInventory,
  useSellerBargains,
  useSellerReviews,
  useSellerPromotions,
  useSellerVideos,
  useSellerAnalytics,
  useSellerReports,
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
  useSellerLedger,
} from "@/hooks/use-seller";
import { useChatInbox, useChatMessages, useInvalidateChat } from "@/hooks/use-chat";
import {
  connectChatSocket,
  disconnectChatSocket,
  emitTypingStart,
  emitTypingStop,
  joinConversation,
  leaveConversation,
  sendChatMessageSocket,
} from "@/lib/chat-socket";
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
} from "@/components/common";
import { ASSETS } from "@/config/assets";
import { pathFromScreen } from "@/config/routes";
import { SHIPPING_ZONES } from "@/services/api/seller-settings";

export type SellerInboxOrderItem = {
  id: string;
  buyer: string;
  city: string;
  item: string;
  qty: number;
  price: number;
  pay: string;
  status: string;
  time: string;
  phone: string;
  icon: string;
  tint: string;
};

export const sellerOrderRef = { current: null as SellerInboxOrderItem | null };

export const SELLER_NAV = [
  {
    group: "Daily work",
    items: [
      { id: "s-dashboard", icon: "home", en: "Home", ne: "गृह" },
      { id: "s-inbox", icon: "package", en: "Orders", ne: "अर्डर", badgeKey: "orders" },
      { id: "s-chat", icon: "message", en: "Messages", ne: "च्याट", badgeKey: "chat" },
      { id: "s-add", icon: "plus", en: "Add product", ne: "सामान थप्नुहोस्" },
    ],
  },
  {
    group: "My shop",
    items: [
      { id: "s-products", icon: "store", en: "My products", ne: "मेरो सामान" },
      { id: "s-videos", icon: "video", en: "Videos", ne: "भिडियो" },
      { id: "s-storefront", icon: "layout", en: "Shop design", ne: "पसल सजावट" },
    ],
  },
  {
    group: "Sell more",
    items: [
      { id: "s-promos", icon: "megaphone", en: "Offers", ne: "छुट" },
      { id: "s-bargain", icon: "bargain", en: "Bargaining", ne: "मोलतोल", badgeKey: "bargain" },
      { id: "s-reviews", icon: "star", en: "Reviews", ne: "समीक्षा" },
    ],
  },
  {
    group: "Money & growth",
    items: [
      { id: "s-ledger", icon: "wallet", en: "My money", ne: "भुक्तानी" },
      { id: "s-analytics", icon: "trendingUp", en: "My shop", ne: "मेरो पसल" },
      { id: "s-reports", icon: "file", en: "What to do", ne: "के गर्ने" },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "s-settings", icon: "settings", en: "Settings", ne: "सेटिङ" },
      { id: "s-profile", icon: "user", en: "My profile", ne: "प्रोफाइल" },
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
}) {
  const close = () => setOpenMobile(false);
  return (
    <>
      <div className={"bz-side-overlay" + (openMobile ? " show" : "")} onClick={close} />
      <aside
        className={"bz-seller-side" + (collapsed ? " collapsed" : "") + (openMobile ? " open" : "")}
      >
        <div className="bz-side-head">
          <div className="bz-side-brand">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--r-md)",
                background: "var(--red)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontWeight: 800,
              }}
            >
              <Icon name="store" size={20} color="#fff" />
            </div>
            <div className="bz-side-brand-text" style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, color: "var(--blue-deep)", fontSize: ".9375rem" }}>
                BazaarCo
              </div>
              <div
                style={{
                  fontSize: ".68rem",
                  color: "var(--ink-500)",
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Seller
              </div>
            </div>
          </div>
          <button
            className="bz-side-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={16} />
          </button>
        </div>

        <div
          className="bz-side-scroll"
          style={{ flex: 1, paddingTop: "6px", paddingInline: 0, overflowY: "auto" }}
        >
          {SELLER_NAV.map((grp) => (
            <div key={grp.group}>
              <div className="bz-side-group">{grp.group}</div>
              {grp.items.map((it) => {
                const active = screen === it.id;
                const badge = it.badgeKey && badges[it.badgeKey] ? badges[it.badgeKey] : 0;
                const showBadge = badge > 0;
                return (
                  <button
                    key={it.id}
                    className={"bz-side-item" + (active ? " active" : "")}
                    onClick={() => {
                      onNav(it.id);
                      close();
                    }}
                    title={it.en}
                  >
                    <Icon
                      name={it.icon}
                      size={20}
                      color={active ? "var(--red)" : "var(--ink-700)"}
                    />
                    <span className="bz-side-label">
                      <span className="bz-side-en">{it.en}</span>
                      <span className="bz-side-sub ne">{it.ne}</span>
                    </span>
                    {showBadge ? <span className="bz-side-badge">{badge}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

export function SellerShell({ screen, children }) {
  const { nav } = useBz();
  const { data: organization, isLoading: orgLoading } = useSellerOrganization();
  const { data: inbox = [] } = useSellerInbox();
  const { data: bargains = [] } = useSellerBargains();
  const { data: chatInbox } = useChatInbox();
  const chatThreads = chatInbox?.threads ?? [];
  const badges = {
    orders: inbox.filter((o: { status?: string }) => o.status === "new" || o.status === "pending")
      .length,
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
    if (orgLoading || screen === "s-onboarding") return;
    if (organization && !organization.linked) {
      nav("s-onboarding");
    }
  }, [organization, orgLoading, screen, nav]);

  const current = SELLER_NAV.flatMap((g) => g.items).find((it) => it.id === screen);

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
      />
      <section className="bz-side-content">
        <div className="bz-side-mobile-bar">
          <button
            onClick={() => setOpenMobile(true)}
            aria-label="Menu"
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
            }}
          >
            <Icon name="menu" size={22} />
          </button>
          <h2>{current ? current.en : "BazaarCo Seller"}</h2>
        </div>
        {organization?.linked &&
          organization.verification &&
          organization.verification.status !== "approved" && (
            <div style={{ padding: "16px 24px 0", maxWidth: "100%" }}>
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
  const { nav, toast } = useBz();
  const user = useBazaarStore((s) => s.user);
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const savedStatus = verification?.status ?? "none";
  const setupOrganization = useSetupSellerOrganization();
  const submitVerification = useSubmitSellerVerification();
  const docInputRef = useRef(null);
  const [stage, setStage] = useState("hero"); // hero | docPick | docUpload | review | bank | done
  const [docType, setDocType] = useState(null); // pan | nid
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [scanned, setScanned] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [shopName, setShopName] = useState("");

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
    try {
      await setupOrganization.mutateAsync({
        shopName: name,
        city: scanned?.address?.split(",").pop()?.trim() || undefined,
      });
      await submitVerification.mutateAsync({
        file: docFile,
        docType,
        docIdNumber: scanned?.docId?.trim() || undefined,
        ownerName: owner,
        address: scanned?.address?.trim() || undefined,
      });
      setStage("done");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not register your shop");
    }
  };

  const startDocUpload = (type) => {
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

  const onDocFile = (e) => {
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
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
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
            <p className="ne" style={{ color: "var(--ink-500)", marginTop: 6 }}>
              तपाईंको पसल प्रमाणित भयो — सामान र भिडियो थप्न सक्नुहुन्छ
            </p>
            <div style={{ marginTop: 24 }}>
              <Button variant="primary" size="lg" full href={pathFromScreen("s-dashboard")}>
                Open dashboard · ड्यासबोर्ड
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
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
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
            <p className="ne" style={{ color: "var(--ink-500)", marginTop: 6 }}>
              ड्यासबोर्ड चलाउँदै गर्नुहोस् — KYC जाँच भइरहेको छ, चाँडै जानकारी दिनेछौं। फेरि अपलोड
              गर्नु पर्दैन।
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
                Open dashboard · ड्यासबोर्ड
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
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
            <p className="ne" style={{ color: "var(--ink-500)", marginTop: 6 }}>
              आफ्नो पसल बजारकोमा खोल्नुहोस्
            </p>

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
                <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
                  ३ मिनेटमा पसल खोल्न सिक्नुहोस्
                </div>
              </div>
              <Icon name="chevronRight" size={20} color="var(--blue)" />
            </div>

            <div style={{ marginTop: 22, textAlign: "left", padding: "0 4px" }}>
              {[
                ["Low commission marketplace", "कम कमिसन बजार", "percent"],
                ["Add a product in 3 taps", "३ ट्यापमा सामान थप्नुहोस्", "plus"],
                ["Daily payouts to eSewa / Khalti", "दैनिक भुक्तानी eSewa / Khalti", "wallet"],
              ].map(([t, ne, i], idx, arr) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: idx < arr.length - 1 ? "1px dashed var(--line-200)" : "none",
                  }}
                >
                  <Icon name={i} size={22} color="var(--blue)" />
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{t}</div>
                    <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>
                      {ne}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <Button
                variant="primary"
                size="lg"
                full
                icon="image"
                onClick={() => setStage("docPick")}
              >
                Register your shop · पसल दर्ता गर्नुहोस्
              </Button>
              <Button variant="ghost" full href={pathFromScreen("home")} style={{ marginTop: 10 }}>
                I'll do this later · पछि गर्छु
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
            <p className="ne" style={{ color: "var(--ink-500)", margin: "4px 0 18px" }}>
              कुन कागजात छ?
            </p>

            {[
              {
                id: "pan",
                icon: "package",
                title: "PAN Card",
                ne: "प्यान कार्ड",
                sub: "Registered business · sell any volume",
              },
              {
                id: "nid",
                icon: "user",
                title: "NID Card",
                ne: "राष्ट्रिय परिचयपत्र",
                sub: "Individual seller · PAN required once sales cross IRD limit",
              },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => startDocUpload(d.id)}
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
                  <div className="ne" style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>
                    {d.ne}
                  </div>
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
            <p className="ne" style={{ color: "var(--ink-500)", marginTop: 0, marginBottom: 16 }}>
              फोटो अपलोड गर्नुहोस् — BazaarCo admin ले जाँच गर्नेछ
            </p>
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
                Continue · अगाडि बढ्नुहोस्
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
              <Icon name="check" size={20} color="var(--success)" /> Document uploaded · अपलोड भयो
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
                Store name · पसलको नाम (required)
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
                Owner name · मालिकको नाम (required)
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
            {[
              [`${scanned.docLabel} no.`, "docId"],
              ["Address · ठेगाना", "address"],
            ].map(([label, key]) => (
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
                onClick={() => {
                  const okStore = (scanned?.shop || shopName || "").trim().length >= 2;
                  const okOwner = (scanned?.name || "").trim().length >= 2;
                  if (!okStore) return toast("Enter your store name to continue");
                  if (!okOwner) return toast("Enter the owner name to continue");
                  setStage("bank");
                }}
              >
                Looks right — continue · ठीक छ
              </Button>
            </div>
          </div>
        )}

        {stage === "bank" && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.25rem", fontWeight: 800 }}>
              How would you like to be paid?
            </h2>
            <p className="ne" style={{ color: "var(--ink-500)", marginTop: 0, marginBottom: 18 }}>
              पैसा कुन वालेटमा चाहिन्छ?
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { id: "esewa", name: "eSewa", src: "/payment/esewa.webp" },
                { id: "khalti", name: "Khalti", src: "/payment/khalti.jpg" },
                { id: "fonepay", name: "Fonepay", src: "/payment/fonepay.png" },
                { id: "ime", name: "IME Pay", src: "/payment/ime.png" },
              ].map((w) => {
                const active = wallet === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setWallet(w.id)}
                    style={{
                      background: active ? "var(--tint-blue-50)" : "#fff",
                      border: `2px solid ${active ? "var(--blue)" : "var(--line-200)"}`,
                      borderRadius: "var(--r-lg)",
                      padding: 18,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {/* Real wallet logo — fixed height, contained so wide wordmarks
                        (eSewa/Khalti/Fonepay) and the square IME app icon align. */}
                    <span
                      style={{
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={w.src}
                        alt={w.name}
                        style={{ maxHeight: 44, maxWidth: "85%", objectFit: "contain" }}
                      />
                    </span>
                    {active && (
                      <div
                        style={{
                          marginTop: 10,
                          color: "var(--blue)",
                          fontSize: ".75rem",
                          fontWeight: 700,
                        }}
                      >
                        ✓ Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {wallet && (
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    fontSize: ".8125rem",
                    fontWeight: 700,
                    color: "var(--ink-700)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Your {wallet} number · वालेट नम्बर
                </label>
                <input
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  className="tnum"
                  style={{
                    width: "100%",
                    height: 56,
                    border: "1.5px solid var(--line-200)",
                    borderRadius: "var(--r-md)",
                    padding: "0 16px",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <Button
                variant="primary"
                full
                size="lg"
                disabled={!wallet || setupOrganization.isPending || submitVerification.isPending}
                onClick={() => void finishSetup()}
                style={{
                  height: "auto",
                  minHeight: 52,
                  padding: "12px 20px",
                  whiteSpace: "normal",
                  lineHeight: 1.3,
                  textAlign: "center",
                }}
              >
                {setupOrganization.isPending || submitVerification.isPending
                  ? "Submitting for review…"
                  : "Submit for admin review · जाँचको लागि पठाउनुहोस्"}
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
            <p className="ne" style={{ color: "var(--ink-500)", marginTop: 6 }}>
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
                Open dashboard · ड्यासबोर्ड
              </Button>
              <Button variant="ghost" full href={pathFromScreen("s-onboarding")}>
                Re-upload document · कागजात फेरि पठाउनुहोस्
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

export function SellerBarChart({ data, height = 280 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const peakIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const chartH = Math.max(height - 72, 160);

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
            label: "7-day total",
            value: `Rs. ${total.toLocaleString()}`,
            tint: "var(--blue-deep)",
          },
          { label: "Daily average", value: `Rs. ${avg.toLocaleString()}`, tint: "var(--ink-700)" },
          {
            label: "Best day",
            value: data[peakIdx]?.value
              ? `${data[peakIdx].label} · Rs. ${data[peakIdx].value.toLocaleString()}`
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
              key={d.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
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
                {d.value > 0 ? `Rs.${d.value.toLocaleString()}` : "—"}
              </div>
              <div
                title={`${d.label}: Rs. ${d.value.toLocaleString()}`}
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

export function SellerSparkline({ data, color = "var(--blue)", height = 36 }) {
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

export function SellerDonut({ slices, size = 160 }) {
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

const HOUR_HEAT_HOURS = 24;
const HOUR_HEAT_DAYS = 7;
const HOUR_HEAT_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function emptyHourRow(): number[] {
  return Array.from({ length: HOUR_HEAT_HOURS }, () => 0);
}

function normalizeHourHeat(raw: unknown): number[][] {
  const rows: number[][] = [];
  for (let di = 0; di < HOUR_HEAT_DAYS; di += 1) {
    const source = Array.isArray(raw) ? raw[di] : undefined;
    if (!Array.isArray(source)) {
      rows.push(emptyHourRow());
      continue;
    }
    rows.push(
      Array.from({ length: HOUR_HEAT_HOURS }, (_, hi) => {
        const v = Number(source[hi]);
        return Number.isFinite(v) ? v : 0;
      }),
    );
  }
  return rows;
}

export function SellerFunnel({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        const drop =
          i > 0 ? Math.round(((rows[i - 1].value - r.value) / rows[i - 1].value) * 100) : null;
        return (
          <div key={r.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: ".875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name={r.icon} size={16} color={r.color} /> {r.label}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="tnum" style={{ fontWeight: 800 }}>
                  {r.value.toLocaleString()}
                </span>
                {drop !== null && (
                  <span style={{ fontSize: ".7rem", color: "var(--danger)", fontWeight: 700 }}>
                    −{drop}%
                  </span>
                )}
              </span>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "var(--line-100)",
                overflow: "hidden",
              }}
            >
              <div
                style={{ width: `${pct}%`, height: "100%", background: r.color, borderRadius: 999 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SellerDashboard() {
  const { nav, toast } = useBz();
  const user = useBazaarStore((s) => s.user);
  const setUser = useBazaarStore((s) => s.setUser);
  const completeOnboardingMutation = useCompleteOnboarding();
  const { data: dashboard, isLoading, isError, error } = useSellerDashboard();
  const { data: inbox = [] } = useSellerInbox();
  const { data: inventory = [] } = useSellerInventory();
  const [range, setRange] = useState("week");

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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const salesByDay = dashboard?.salesByDay ?? [];
  const paymentSplit = dashboard?.paymentSplit ?? [];
  const funnel = dashboard?.funnel ?? [];
  const topProducts = dashboard?.topProducts ?? [];
  const activity = dashboard?.activity ?? [];
  const kpis = dashboard?.kpis ?? [];
  const bargainGlance = dashboard?.bargainGlance ?? {
    pending: 0,
    accepted: 0,
    avgGiven: 0,
    marginGiven: 0,
  };
  const hourHeat = normalizeHourHeat(dashboard?.hourHeat);
  // Store trust strip — real numbers from the backend snapshot. A brand-new
  // seller has no orders/reviews/shipments yet, so we show calm placeholders
  // ("New", "—") instead of fabricated stats.
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
  )?.trust ?? {
    ordersThisWeek: 0,
    storeRating: 0,
    ratingCount: 0,
    onTimeShipPct: null,
    repeatBuyerPct: 0,
  };
  const trustStrip = [
    {
      k: "Orders this week",
      v: String(trust.ordersThisWeek ?? 0),
      c: "var(--blue-deep)",
    },
    {
      k: "Store rating",
      v: (trust.ratingCount ?? 0) > 0 ? `${Number(trust.storeRating).toFixed(1)} ★` : "New",
      c: "var(--gold)",
    },
    {
      k: "On-time ship",
      v: trust.onTimeShipPct == null ? "—" : `${trust.onTimeShipPct}%`,
      c: "var(--success)",
    },
    {
      k: "Repeat buyers",
      v: (trust.ordersThisWeek ?? 0) > 0 ? `${trust.repeatBuyerPct ?? 0}%` : "—",
      c: "var(--saffron)",
    },
  ];
  const sellerName = displayName(user, "Seller");
  const todaySales = kpis[0]?.value ?? "Rs. 0";
  const ordersPlaced = funnel.length > 0 ? (funnel[funnel.length - 1]?.value ?? 0) : 0;
  const pendingOrders = inbox.filter(
    (o: { status?: string }) => o.status === "new" || o.status === "pending",
  ).length;
  const lowStock = inventory.filter((i: { stock?: number }) => (i.stock ?? 0) <= 3).length;
  const tasks = [
    pendingOrders > 0 && {
      icon: "package",
      tint: "red",
      label: `Accept ${pendingOrders} new order${pendingOrders > 1 ? "s" : ""}`,
      ne: "नयाँ अर्डर",
      to: "s-inbox",
      urgent: true,
      action: { label: "View orders", onAct: () => nav("s-inbox") },
    },
    lowStock > 0 && {
      icon: "zap",
      tint: "saffron",
      label: `${lowStock} item${lowStock > 1 ? "s" : ""} running low`,
      ne: "स्टक कम",
      to: "s-products",
      urgent: false,
      action: { label: "Restock", onAct: () => nav("s-products") },
    },
  ].filter(Boolean);

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />

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
              Namaste, {sellerName} <span style={{ fontSize: "1.5rem" }}>🙏</span>
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".875rem" }}>
              {today} · <span className="ne">बजारकोमा स्वागत छ</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ChipGroup
              options={[
                { value: "today", label: "Today" },
                { value: "week", label: "7 days" },
                { value: "month", label: "30 days" },
              ]}
              value={range}
              onChange={setRange}
            />
          </div>
        </div>

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
              No sales data yet. Numbers will appear here when you start selling.
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
                  <div
                    className="ne"
                    style={{ fontSize: ".7rem", color: "var(--ink-400)", fontWeight: 600 }}
                  >
                    {k.sub}
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
              <SellerSparkline data={k.spark} color={k.color} />
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
                  {k.couriers.map((c) => (
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
            <div
              className="ne"
              style={{ fontSize: ".8125rem", color: "var(--ink-500)", fontWeight: 600 }}
            >
              आजको कुल कमाइ · Earnings today
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
              <Icon name="wallet" size={14} color="var(--success)" />{" "}
              <span className="ne">आजको बिक्री</span> · From your dashboard
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
                Today's tasks · आजको काम
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
                    background: TINTS[t.tint][0],
                    color: TINTS[t.tint][2],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={t.icon} size={20} color={TINTS[t.tint][2]} />
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
                  <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    {t.ne}
                  </div>
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
                <div
                  className="ne"
                  style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}
                >
                  ७ दिनको बिक्री
                </div>
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
            <SellerBarChart data={salesByDay} height={200} />
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
            {bargainGlance.pending > 0 && (
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
                  <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    १ मोलतोल बाँकी
                  </div>
                </div>
                <Icon name="chevronRight" size={18} color="var(--red)" />
              </AppLink>
            )}
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
                  Rs. {bargainGlance.marginGiven.toLocaleString()}
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                  Margin given via bargain (this week)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hour-of-day heatmap — when buyers visit your store */}
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
              alignItems: "flex-end",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h3
                style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}
              >
                Best time to post
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}>
                When visitors check your store. Darker = more visitors.
              </p>
            </div>
            <div
              style={{
                fontSize: ".75rem",
                color: "var(--ink-500)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Low{" "}
              <span style={{ display: "inline-flex", gap: 2 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((o) => (
                  <span
                    key={o}
                    style={{
                      width: 14,
                      height: 12,
                      background: `rgba(29,78,216,${0.08 + o * 0.7})`,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </span>{" "}
              High
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                display: "inline-grid",
                gridTemplateColumns: "auto repeat(24, minmax(20px, 1fr))",
                gap: 3,
                minWidth: "100%",
              }}
            >
              <div></div>
              {Array.from({ length: 24 }).map((_, h) => (
                <div
                  key={h}
                  style={{
                    fontSize: ".6rem",
                    color: "var(--ink-400)",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {h % 6 === 0 ? `${h}` : ""}
                </div>
              ))}
              {hourHeat.map((row, di) => {
                const d = HOUR_HEAT_DAY_LABELS[di] ?? `Day ${di}`;
                const cells = Array.isArray(row) ? row : emptyHourRow();
                return (
                  <Fragment key={d}>
                    <div
                      style={{
                        fontSize: ".7rem",
                        color: "var(--ink-500)",
                        fontWeight: 700,
                        paddingRight: 6,
                        alignSelf: "center",
                      }}
                    >
                      {d}
                    </div>
                    {cells.map((v, hi) => {
                      const o = Math.min(v / 18, 1);
                      return (
                        <div
                          key={hi}
                          title={`${d} ${hi}:00 — ${v} visits`}
                          style={{
                            height: 18,
                            background: `rgba(29,78,216,${0.08 + o * 0.7})`,
                            borderRadius: 2,
                          }}
                        />
                      );
                    })}
                  </Fragment>
                );
              })}
            </div>
          </div>
          <p
            style={{
              marginTop: 12,
              fontSize: ".8125rem",
              color: "var(--blue-deep)",
              background: "var(--tint-blue-50)",
              padding: "8px 12px",
              borderRadius: "var(--r-md)",
            }}
          >
            <Icon
              name="badgeCheck"
              size={14}
              color="var(--blue)"
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            {hourHeat.flat().some((v) => v > 0)
              ? "Darker cells show when more visitors browse your store."
              : "Visitor activity will appear here once buyers start viewing your shop."}
          </p>
        </div>

        {/* Funnel + activity */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 18,
            marginBottom: 18,
          }}
          className="bz-seller-grid"
        >
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 22,
            }}
          >
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--blue-deep)",
              }}
            >
              Buyer journey
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: ".75rem", color: "var(--ink-500)" }}>
              This week — where buyers drop off
            </p>
            <SellerFunnel rows={funnel} />
            <div
              style={{
                marginTop: 14,
                background: "var(--tint-blue-50)",
                borderRadius: "var(--r-md)",
                padding: 10,
                fontSize: ".8125rem",
                color: "var(--blue-deep)",
              }}
            >
              <Icon
                name="badgeCheck"
                size={14}
                color="var(--blue)"
                style={{ verticalAlign: "middle", marginRight: 4 }}
              />
              55% of carts don't reach checkout — add video to top products to lift this.
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 22,
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
              Recent activity · हालैको
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
              Top products · मनपर्ने सामान
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
                    Rs. {p.rev.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 8px", width: 120 }}>
                    <SellerSparkline data={p.spark} color="var(--blue)" height={24} />
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
            { icon: "plus", label: "Add product", ne: "थप्नुहोस्", tint: "green", to: "s-add" },
            {
              icon: "package",
              label: "Orders",
              ne: "अर्डर",
              tint: "red",
              to: "s-inbox",
              badge: "2",
            },
            {
              icon: "store",
              label: "My products",
              ne: "मेरो सामान",
              tint: "blue",
              to: "s-products",
            },
            { icon: "wallet", label: "Payouts", ne: "भुक्तानी", tint: "saffron", to: "s-ledger" },
          ].map((a) => (
            <AppLink
              key={a.label}
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
                  background: TINTS[a.tint][0],
                  color: TINTS[a.tint][2],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={a.icon} size={22} color={TINTS[a.tint][2]} />
              </span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 800, fontSize: ".9375rem" }}>{a.label}</div>
                <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  {a.ne}
                </div>
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
export const INBOX_TONE = { new: "red", packed: "saffron", shipped: "blue", done: "success" };
export const INBOX_LABEL = {
  new: { en: "New order", ne: "नयाँ अर्डर", icon: "package" },
  packed: { en: "Packed", ne: "प्याक भयो", icon: "package" },
  shipped: { en: "Shipped", ne: "पठाइयो", icon: "truck" },
  done: { en: "Delivered", ne: "पुग्यो", icon: "check" },
};

export function OrderCard({ o, onOpen }) {
  const lbl = INBOX_LABEL[o.status];
  const tone = INBOX_TONE[o.status];
  return (
    <button
      onClick={() => onOpen(o)}
      style={{
        background: "#fff",
        border: `1.5px solid ${o.status === "new" ? "var(--danger)" : "var(--line-200)"}`,
        borderRadius: "var(--r-lg)",
        padding: 12,
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        display: "flex",
        gap: 10,
      }}
    >
      <Placeholder
        icon={o.icon}
        tint={o.tint}
        style={{ width: 56, height: 56, flexShrink: 0 }}
        radius="var(--r-md)"
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
          Rs. {o.price.toLocaleString()}
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

export function inDateRange(o, range) {
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
  const { nav } = useBz();
  const { data: INBOX_ORDERS = [], isLoading, isError, error } = useSellerInbox();
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("list"); // list | kanban
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");

  const q = search.trim().toLowerCase();
  const baseFiltered = INBOX_ORDERS.filter((o) => {
    if (q && !`${o.id} ${o.buyer} ${o.city} ${o.item}`.toLowerCase().includes(q)) return false;
    if (!inDateRange(o, range)) return false;
    return true;
  });
  const counts = {
    all: baseFiltered.length,
    new: baseFiltered.filter((o) => o.status === "new").length,
    packed: baseFiltered.filter((o) => o.status === "packed").length,
    shipped: baseFiltered.filter((o) => o.status === "shipped").length,
    done: baseFiltered.filter((o) => o.status === "done").length,
  };
  const list = baseFiltered.filter((o) => tab === "all" || o.status === tab);
  const openOrder = (o) => {
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
    { id: "all", label: "All" },
    { id: "new", label: "New", tone: "red" },
    { id: "packed", label: "Packing", tone: "saffron" },
    { id: "shipped", label: "Shipped", tone: "blue" },
    { id: "done", label: "Delivered", tone: "success" },
  ];

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
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
              Orders{" "}
              <span
                className="ne"
                style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
              >
                · अर्डर
              </span>
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
              Tap an order to print labels, message buyer, or update status.
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

        {/* Status tabs with counts */}
        <div
          style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}
        >
          {tabs.map((t) => {
            const c = counts[t.id];
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: active ? "var(--ink-900)" : "#fff",
                  color: active ? "#fff" : "var(--ink-700)",
                  border: `1.5px solid ${active ? "var(--ink-900)" : "var(--line-200)"}`,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                <span
                  className="tnum"
                  style={{
                    background: active ? "rgba(255,255,255,.2)" : "var(--line-100)",
                    padding: "1px 8px",
                    borderRadius: 999,
                    fontSize: ".7rem",
                    fontWeight: 800,
                  }}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>

        {view === "kanban" ? (
          <div className="bz-kanban">
            {["new", "packed", "shipped", "done"].map((col) => {
              const lbl = INBOX_LABEL[col];
              const tone = INBOX_TONE[col];
              const items = baseFiltered.filter((o) => o.status === col);
              return (
                <div
                  key={col}
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
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-500)" }}>
                  <Icon name="package" size={48} color="var(--ink-300)" />
                  <p style={{ marginTop: 12 }}>No orders here yet</p>
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
  const [busy, setBusy] = useState(false);

  const accept = () => {
    setBusy(true);
    setTimeout(() => {
      toast(`Order ${o.id} accepted — pack and call rider`);
      nav("s-inbox");
    }, 600);
  };
  const reject = () => {
    if (window.confirm("Tell the buyer you can't fulfill this order? · अर्डर रद्द गर्ने?")) {
      toast("Marked out of stock — buyer refunded");
      nav("s-inbox");
    }
  };

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
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
              New order · नयाँ अर्डर
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
            Buyer · खरिदकर्ता
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--tint-blue-50)",
                color: "var(--blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.5rem",
              }}
            >
              {o.buyer[0]}
            </div>
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
            Item · सामान
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
            Payment · भुक्तानी
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
              Rs. {o.price.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
              fontSize: ".875rem",
            }}
          >
            <span style={{ color: "var(--ink-500)" }}>Platform fee (2%)</span>
            <span className="tnum" style={{ color: "var(--danger)", fontWeight: 700 }}>
              − Rs. {Math.round(o.price * 0.02)}
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
            <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>You get · तपाईंलाई</span>
            <span
              className="tnum"
              style={{ fontWeight: 800, fontSize: "1.375rem", color: "var(--success)" }}
            >
              Rs. {(o.price - Math.round(o.price * 0.02)).toLocaleString()}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--ink-500)" }}>
            Method: {o.pay}
          </div>
        </div>

        {/* ONE BIG ACTION */}
        <Button variant="primary" size="lg" full loading={busy} onClick={accept} icon="check">
          Accept order · स्वीकार गर्नुहोस्
        </Button>
        <Button variant="danger" full onClick={reject} style={{ marginTop: 10 }}>
          Can't fulfill · पूरा गर्न सक्दिनँ
        </Button>

        {/* Print actions */}
        <div
          style={{
            marginTop: 16,
            padding: 14,
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
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
            Print · प्रिन्ट
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              {
                icon: "printer",
                en: "Shipping label",
                ne: "लेबल",
                msg: "Pathao label generated — print or share PDF",
              },
              { icon: "file", en: "Invoice", ne: "बिल", msg: "Invoice PDF ready" },
              { icon: "filePlus", en: "Packing slip", ne: "प्याकिङ", msg: "Packing slip ready" },
            ].map((p) => (
              <button
                key={p.en}
                onClick={() => toast(p.msg)}
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  padding: "12px 8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name={p.icon} size={22} color="var(--blue)" />
                <div style={{ fontWeight: 700, fontSize: ".75rem", color: "var(--ink-900)" }}>
                  {p.en}
                </div>
                <div className="ne" style={{ fontSize: ".65rem", color: "var(--ink-500)" }}>
                  {p.ne}
                </div>
              </button>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: ".75rem", color: "var(--ink-500)" }}>
            Courier:&nbsp;
            <select
              defaultValue="pathao"
              style={{
                border: "1px solid var(--line-200)",
                borderRadius: 6,
                padding: "2px 6px",
                fontFamily: "var(--font-sans)",
                color: "var(--ink-900)",
                fontWeight: 600,
              }}
            >
              <option value="pathao">Pathao</option>
              <option value="aramex">Aramex</option>
              <option value="sajilo">Sajilo Logistics</option>
              <option value="self">Self-delivery</option>
            </select>
          </p>
        </div>

        <div
          style={{
            marginTop: 18,
            background: "var(--tint-blue-50)",
            borderRadius: "var(--r-md)",
            padding: 12,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Icon name="badgeCheck" size={18} color="var(--blue)" />
          <div style={{ fontSize: ".8125rem", color: "var(--blue-deep)" }}>
            <b>What happens next?</b>
            <br />
            After you accept, pack the item. We'll send a rider. Money lands in your wallet within
            24 hrs.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 4.4a Category-specific attribute fields ---------- */
export function CategoryAttrFields({ category, values, onChange }) {
  const { data: categories = [] } = useCategories();
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const fields = categories.find((c) => c.id === category)?.fields || [];
  if (!fields.length) return null;
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
  const set = (k, v) => onChange({ ...values, [k]: v });
  const toggleMulti = (k, opt) => {
    const cur = Array.isArray(values[k]) ? values[k] : [];
    set(k, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  };
  const addOther = (k) => {
    const raw = (otherText[k] || "").trim();
    if (!raw) return;
    const cur = Array.isArray(values[k]) ? values[k] : [];
    if (!cur.some((x) => x.toLowerCase() === raw.toLowerCase())) set(k, [...cur, raw]);
    setOtherText((t) => ({ ...t, [k]: "" }));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {fields.map((f) => (
        <div key={f.k}>
          <label
            style={{
              fontSize: ".8125rem",
              fontWeight: 700,
              color: "var(--ink-700)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            {f.en}{" "}
            <span className="ne" style={{ fontWeight: 600, color: "var(--ink-400)" }}>
              · {f.ne}
            </span>
            {f.req && (
              <span style={{ color: "var(--red)", fontWeight: 800 }} title="Required">
                *
              </span>
            )}
            {f.u && (
              <span style={{ color: "var(--ink-400)", fontWeight: 600, fontSize: ".75rem" }}>
                ({f.u})
              </span>
            )}
          </label>

          {f.t === "select" && (
            <select
              value={values[f.k] || ""}
              onChange={(e) => set(f.k, e.target.value)}
              style={{
                ...inputStyle,
                color: values[f.k] ? "var(--ink-900)" : "var(--ink-400)",
                fontWeight: values[f.k] ? 600 : 400,
              }}
            >
              <option value="">Choose…</option>
              {f.o.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}

          {f.t === "multi" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[...f.o, ...(values[f.k] || []).filter((v) => !f.o.includes(v))].map((o) => {
                const on = (values[f.k] || []).includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => toggleMulti(f.k, o)}
                    aria-pressed={on}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--r-full)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: ".8125rem",
                      minHeight: 44,
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
                      minHeight: 44,
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
                      minHeight: 44,
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
          )}

          {(f.t === "text" || f.t === "num") && (
            <input
              value={values[f.k] || ""}
              inputMode={f.t === "num" ? "numeric" : undefined}
              onChange={(e) =>
                set(f.k, f.t === "num" ? e.target.value.replace(/\D/g, "") : e.target.value)
              }
              placeholder="Type here"
              style={inputStyle}
            />
          )}

          {f.t === "date" && (
            <input
              type="date"
              value={values[f.k] || ""}
              onChange={(e) => set(f.k, e.target.value)}
              style={inputStyle}
            />
          )}

          {f.t === "toggle" && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: ".875rem",
                color: "var(--ink-700)",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={!!values[f.k]}
                onChange={(e) => set(f.k, e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "var(--blue)" }}
              />
              Yes · हो
            </label>
          )}

          {f.help && (
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", margin: "6px 0 0" }}>
              {f.help}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Has the seller filled an attribute field? (multi=any selected, toggle=true, else non-empty)
export const attrFilled = (f: { t: string }, v: unknown) => {
  if (f.t === "multi") return Array.isArray(v) && v.length > 0;
  if (f.t === "toggle") return v === true;
  return !!v && (typeof v !== "string" || v.trim() !== "");
};

/* ---------- 4.4 Add Product — Three-Tap Listing ---------- */
export function SellerAddProduct() {
  const { nav, toast } = useBz();
  const { data: organization } = useSellerOrganization();
  const verification = organization?.verification;
  const vStatus = verification?.status ?? "none";
  const canSell = verification?.canSell === true;
  const { data: categories = [] } = useCategories();
  const uploadImage = useUploadImage();
  const createProduct = useCreateProduct();
  const [productPhotos, setProductPhotos] = useState<ProductPhoto[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([
    { id: 1, name: "Small", price: "", stock: "" },
    { id: 2, name: "Medium", price: "", stock: "" },
    { id: 3, name: "Large", price: "", stock: "" },
  ]);
  const [bargainOk, setBargainOk] = useState(true);
  const [bargainPct, setBargainPct] = useState(10);
  const [attrs, setAttrs] = useState({});

  // New category → start its attributes fresh (never carry the wrong category's fields).
  const pickCategory = (id) => {
    setCategory(id);
    setAttrs({});
  };

  const attrFields = categories.find((c) => c.id === category)?.fields || [];

  const titleOk = title.trim().length >= 3;
  const variantsOk = !hasVariants || variants.every((v) => v.price && v.stock);
  const photosOk = productPhotos.length >= 3 && productPhotos.length <= 5;
  const canPublish =
    photosOk && titleOk && Boolean(category) && (hasVariants ? variantsOk : price && stock);

  const publishMissing: string[] = [];
  if (!photosOk) publishMissing.push("3 to 5 photos");
  if (!titleOk) publishMissing.push("product name (3+ characters)");
  if (!category) publishMissing.push("category");
  if (hasVariants) {
    if (!variantsOk) publishMissing.push("price & stock on every variant");
  } else {
    if (!price) publishMissing.push("price (Rs.)");
    if (!stock) publishMissing.push("stock quantity");
  }
  const categoryMeta = categories.find((c) => c.id === category);
  const displayPrice = hasVariants ? variants.find((v) => v.price)?.price : price;
  const displayStock = hasVariants
    ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
    : stock;

  const updateVariant = (id, key, val) =>
    setVariants((arr) => arr.map((v) => (v.id === id ? { ...v, [key]: val } : v)));
  const addVariant = () =>
    setVariants((arr) => [...arr, { id: Date.now(), name: "", price: "", stock: "" }]);
  const removeVariant = (id) => setVariants((arr) => arr.filter((v) => v.id !== id));

  // Publish: upload every photo (3–5, cover first), then create the product.
  // Postgres is the source of truth; the server indexes it into search in the
  // background.
  const publishing = uploadImage.isPending || createProduct.isPending;
  const handlePublish = async () => {
    if (!canPublish || publishing) return;
    try {
      const uploaded = await Promise.all(
        productPhotos.map((photo) => uploadImage.mutateAsync({ file: photo.file })),
      );
      const images = uploaded.map((u) => u.url);
      await createProduct.mutateAsync({
        name: title.trim(),
        description: description.trim() || undefined,
        price: Number(price || displayPrice || 0),
        categoryId: category,
        images,
        img: images[0],
        metadata: attrs,
        stock: hasVariants ? undefined : Number(stock) || 0,
        variants: hasVariants
          ? variants
              .filter((v) => v.name && v.price && v.stock)
              .map((v) => ({
                id: String(v.id),
                name: v.name.trim(),
                price: Number(v.price),
                stock: Number(v.stock),
              }))
          : undefined,
        allowBargaining: bargainOk,
        maxDiscountPct: bargainOk ? bargainPct : 0,
      });
      toast("Product published! · प्रकाशित भयो");
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

  return (
    <div className="bz-seller-page">
      <div className="bz-seller-add-layout">
        <div>
          <SellerHelpBar />

          <AppLink
            href={pathFromScreen("s-dashboard")}
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
            <Icon name="chevronLeft" size={16} /> Back to dashboard
          </AppLink>

          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Add a product
          </h1>
          <p className="ne" style={{ color: "var(--ink-500)", margin: "4px 0 12px" }}>
            ३ ट्यापमा सामान थप्नुहोस्
          </p>

          {/* Progress */}
          <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
            {[photosOk, titleOk, hasVariants ? variantsOk : price && stock].map((done, i) => (
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
                  Add photos{" "}
                  <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>
                    3 required · up to 5
                  </span>
                </h3>
                <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  ३ फोटो अनिवार्य · ५ सम्म
                </div>
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
                  background: titleOk ? "var(--success)" : "var(--blue)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {titleOk ? <Icon name="check" size={18} color="#fff" /> : 2}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  Describe your product
                </h3>
                <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  सामानको बारेमा लेख्नुहोस्
                </div>
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
              Product name · नाम
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Green cotton kurta — size XL"
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
              Description · विवरण{" "}
              <span style={{ fontWeight: 600, color: "var(--ink-400)" }}>· optional</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers what makes it special — material, size, what's included…"
              rows={3}
              style={{
                width: "100%",
                fontSize: "1rem",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "12px 16px",
                outline: "none",
                fontFamily: "var(--font-sans)",
                resize: "vertical",
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
              Category · वर्ग
            </label>
            <select
              value={category}
              onChange={(e) => pickCategory(e.target.value)}
              style={{
                width: "100%",
                height: 56,
                fontSize: "1rem",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-md)",
                padding: "0 14px",
                outline: "none",
                background: "#fff",
                fontFamily: "var(--font-sans)",
                color: category ? "var(--ink-900)" : "var(--ink-400)",
                fontWeight: category ? 600 : 400,
              }}
            >
              <option value="">Pick a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.en} · {c.ne}
                </option>
              ))}
            </select>
            <p style={{ fontSize: ".75rem", color: "var(--ink-400)", marginTop: 6 }}>
              Picking the right category shows buyers the right details — and helps them find you.
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
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                    Product details{" "}
                    <span style={{ fontSize: ".75rem", color: "var(--ink-400)", fontWeight: 600 }}>
                      Optional · ऐच्छिक
                    </span>
                  </h3>
                  <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                    विवरण भर्नुहोस् — किनेर फिर्ता आउने सम्भावना घट्छ
                  </div>
                </div>
              </div>
              <p style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                More detail = buyers find you in filters and get fewer surprises (fewer returns).{" "}
                <span style={{ color: "var(--red)", fontWeight: 800 }}>*</span> = important.
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
                <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  मूल्य र संख्या
                </div>
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
                    Price (Rs.) · मूल्य
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
                    Stock · संख्या
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
                <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  मोलतोल स्वीकार?
                </div>
              </div>
              <label
                style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={bargainOk}
                  onChange={(e) => setBargainOk(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--red)" }}
                />
              </label>
            </div>
            {bargainOk && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: ".8125rem", color: "var(--ink-700)" }}>
                    Max discount you allow
                  </span>
                  <span className="tnum" style={{ fontWeight: 800, color: "var(--red)" }}>
                    {bargainPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={bargainPct}
                  onChange={(e) => setBargainPct(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--red)" }}
                />
                <p style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 4 }}>
                  Buyers see only &quot;Make an offer&quot; — never your limit.
                </p>
              </>
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
            {publishing ? "Publishing…" : "Publish · प्रकाशित गर्नुहोस्"}
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
              <span
                className="ne"
                style={{ display: "block", marginTop: 4, color: "var(--ink-400)" }}
              >
                माथि स्क्रोल गरेर फोटो, नाम, वर्ग र मूल्य/स्टक भर्नुहोस्
              </span>
            </p>
          )}
        </div>

        <aside className="bz-seller-add-preview" aria-label="Listing preview">
          <div
            style={{
              background: "#fff",
              border: "1.5px solid var(--line-200)",
              borderRadius: "var(--r-lg)",
              padding: 18,
              boxShadow: "var(--sh-2)",
            }}
          >
            <div
              style={{
                fontSize: ".7rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                color: "var(--ink-500)",
                marginBottom: 12,
              }}
            >
              Buyer preview
            </div>
            {productPhotos.length > 0 ? (
              <img
                src={productPhotos[0].previewUrl}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  marginBottom: 12,
                  borderRadius: "var(--r-md)",
                  objectFit: "cover",
                  border: "1px solid var(--line-200)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  marginBottom: 12,
                  borderRadius: "var(--r-md)",
                  background: "var(--line-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--ink-400)",
                  fontSize: ".875rem",
                  fontWeight: 600,
                }}
              >
                Add photos
              </div>
            )}
            <div
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--blue-deep)",
                lineHeight: 1.3,
              }}
            >
              {titleOk ? title : "Product title"}
            </div>
            {categoryMeta && (
              <p
                className="ne"
                style={{ margin: "6px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}
              >
                {categoryMeta.en}
              </p>
            )}
            <div
              className="tnum"
              style={{
                marginTop: 12,
                fontSize: "1.35rem",
                fontWeight: 800,
                color: displayPrice ? "var(--blue-deep)" : "var(--ink-400)",
              }}
            >
              {displayPrice ? `Rs. ${Number(displayPrice).toLocaleString()}` : "Set price"}
            </div>
            {displayStock ? (
              <p style={{ margin: "6px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                {displayStock} in stock
                {hasVariants ? " (all sizes)" : ""}
              </p>
            ) : null}
            <ul
              style={{
                margin: "16px 0 0",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                { done: productPhotos.length > 0, label: "Photos" },
                { done: titleOk, label: "Title & category" },
                { done: hasVariants ? variantsOk : !!(price && stock), label: "Price & stock" },
              ].map((step) => (
                <li
                  key={step.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: ".8125rem",
                    color: step.done ? "var(--success)" : "var(--ink-400)",
                    fontWeight: 600,
                  }}
                >
                  {step.done ? (
                    <Icon name="check" size={14} color="currentColor" />
                  ) : (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid currentColor",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {step.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- 4.5 Inventory — swipe-to-sell ---------- */
export const INV_SORTS = [
  { value: "added", label: "Recently added" },
  { value: "stockLow", label: "Stock low → high" },
  { value: "priceLow", label: "Price low → high" },
  { value: "name", label: "Name A → Z" },
];

export function SellerInventory() {
  const { nav, toast } = useBz();
  const { data: inventoryData = [], isLoading, isError, error } = useSellerInventory();
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(inventoryData);
  }, [inventoryData]);
  const [expanded, setExpanded] = useState(null);
  const [status, setStatus] = useState("all"); // all | active | low | oos
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("added");

  const dec = (id) =>
    setItems((list) =>
      list.map((it) => (it.id === id ? { ...it, stock: Math.max(0, it.stock - 1) } : it)),
    );
  const inc = (id) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, stock: it.stock + 1 } : it)));
  const sellInShop = (id) => {
    dec(id);
    toast("Sold one in shop · −1 stock");
  };

  const bucket = (it) => (it.stock === 0 ? "oos" : it.stock <= 3 ? "low" : "active");
  const counts = {
    all: items.length,
    active: items.filter((it) => bucket(it) === "active").length,
    low: items.filter((it) => bucket(it) === "low").length,
    oos: items.filter((it) => bucket(it) === "oos").length,
  };
  const statusTabs = [
    { id: "all", label: "All", tone: "ink" },
    { id: "active", label: "Active", tone: "success" },
    { id: "low", label: "Low stock", tone: "saffron" },
    { id: "oos", label: "Out of stock", tone: "danger" },
  ];

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
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div
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
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
              fontWeight: 800,
              color: "var(--blue-deep)",
            }}
          >
            My products{" "}
            <span
              className="ne"
              style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
            >
              · मेरो सामान
            </span>
          </h1>
          <Button variant="primary" icon="plus" href={pathFromScreen("s-add")}>
            Add
          </Button>
        </div>

        <div
          style={{
            background: "var(--tint-blue-50)",
            padding: 12,
            borderRadius: "var(--r-md)",
            fontSize: ".8125rem",
            color: "var(--blue-deep)",
            marginBottom: 14,
            display: "flex",
            gap: 10,
          }}
        >
          <Icon name="badgeCheck" size={18} color="var(--blue)" />
          <span>Tap any item to change stock or edit. Items running low are marked orange.</span>
        </div>

        {/* Status chips with counts */}
        <div
          style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}
        >
          {statusTabs.map((t) => {
            const active = status === t.id;
            const tone =
              t.tone === "ink"
                ? "var(--ink-900)"
                : t.tone === "success"
                  ? "var(--success)"
                  : t.tone === "saffron"
                    ? "var(--saffron)"
                    : "var(--danger)";
            return (
              <button
                key={t.id}
                onClick={() => setStatus(t.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  minHeight: 40,
                  background: active ? tone : "#fff",
                  color: active ? "#fff" : "var(--ink-700)",
                  border: `1.5px solid ${active ? tone : "var(--line-200)"}`,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: ".8125rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                <span
                  className="tnum"
                  style={{
                    background: active ? "rgba(255,255,255,.2)" : "var(--line-100)",
                    padding: "1px 8px",
                    borderRadius: 999,
                    fontSize: ".7rem",
                    fontWeight: 800,
                  }}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + sort row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px", position: "relative", minWidth: 200 }}>
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
            {INV_SORTS.map((o) => (
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

        <div
          className="tnum"
          style={{
            fontSize: ".8125rem",
            color: "var(--ink-500)",
            marginBottom: 12,
            fontWeight: 700,
          }}
        >
          {visible.length} of {items.length} product{items.length === 1 ? "" : "s"}
        </div>

        {visible.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              border: "1.5px dashed var(--line-200)",
              borderRadius: "var(--r-lg)",
            }}
          >
            <Icon name="package" size={40} color="var(--ink-300)" />
            <div style={{ marginTop: 10, fontWeight: 800, color: "var(--ink-900)" }}>
              No products match
            </div>
            <div style={{ color: "var(--ink-500)", fontSize: ".8125rem", margin: "4px 0 14px" }}>
              Try clearing search or status filter.
            </div>
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
                return (
                  <div
                    key={it.id}
                    style={{
                      background: oos ? "var(--line-100)" : low ? "rgba(247,127,0,.08)" : "#fff",
                      border: `1.5px solid ${low ? "var(--saffron)" : "var(--line-200)"}`,
                      borderRadius: "var(--r-lg)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : it.id)}
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
                      <Placeholder
                        icon={it.icon}
                        tint={it.tint}
                        style={{ width: 72, height: 72 }}
                        radius="var(--r-md)"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>{it.name}</div>
                        <div
                          className="tnum"
                          style={{
                            fontSize: ".875rem",
                            color: "var(--blue-deep)",
                            fontWeight: 800,
                            marginTop: 2,
                          }}
                        >
                          Rs. {it.price.toLocaleString()}
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
                              <Icon name="zap" size={14} color="var(--danger)" /> Out of stock ·
                              सकियो
                            </>
                          ) : low ? (
                            <>
                              <Icon name="zap" size={14} color="var(--saffron)" /> Only {it.stock}{" "}
                              left · कम छ
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
                        style={{ padding: "0 14px 14px", borderTop: "1px dashed var(--line-200)" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 0",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: ".875rem" }}>
                            Change stock · संख्या परिवर्तन
                          </div>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              border: "1.5px solid var(--line-200)",
                              borderRadius: "var(--r-md)",
                              overflow: "hidden",
                              background: "#fff",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dec(it.id);
                              }}
                              disabled={it.stock === 0}
                              style={{
                                width: 44,
                                height: 48,
                                background: "#fff",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--ink-700)",
                              }}
                            >
                              <Icon name="minus" size={18} />
                            </button>
                            <span
                              className="tnum"
                              style={{
                                width: 48,
                                textAlign: "center",
                                fontWeight: 800,
                                fontSize: "1.125rem",
                              }}
                            >
                              {it.stock}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                inc(it.id);
                              }}
                              style={{
                                width: 44,
                                height: 48,
                                background: "#fff",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--ink-700)",
                              }}
                            >
                              <Icon name="plus" size={18} />
                            </button>
                          </div>
                        </div>
                        {!oos && (
                          <Button
                            variant="secondary"
                            full
                            onClick={() => sellInShop(it.id)}
                            icon="store"
                          >
                            Sold one in my shop · पसलमा बेचेँ (−1)
                          </Button>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <Button variant="ghost" full icon="image">
                            Edit photo
                          </Button>
                          <Button variant="ghost" full>
                            Edit price
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
  );
}

/* ---------- 4.6 Payouts Ledger ---------- */
export function SellerLedger() {
  const { nav } = useBz();
  const { data: ledger, isLoading, isError, error } = useSellerLedger();
  const rows = ledger?.rows ?? [];
  const statusLabel = {
    received: {
      en: "Received",
      ne: "पैसा आयो ✓",
      color: "var(--success)",
      bg: "rgba(22,163,74,.1)",
    },
    sending: { en: "Sending", ne: "पठाउँदै", color: "var(--saffron)", bg: "rgba(247,127,0,.1)" },
    held: { en: "On hold", ne: "रोकिएको", color: "var(--danger)", bg: "rgba(220,38,38,.1)" },
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
            Payouts{" "}
            <span
              className="ne"
              style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
            >
              · भुक्तानी
            </span>
          </h1>
          <Button variant="ghost" href={pathFromScreen("s-dashboard")} icon="chevronLeft">
            Back
          </Button>
        </div>

        {/* When will I get my money? explainer */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--tint-blue-50) 0%, rgba(22,163,74,.06) 100%)",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Icon name="wallet" size={22} color="var(--blue-deep)" />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--blue-deep)" }}>
              When do I get my money?
            </h3>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: ".875rem",
              color: "var(--ink-700)",
              lineHeight: 1.7,
            }}
          >
            <li>
              <b>eSewa / Khalti orders:</b> Money lands within 24 hours of delivery.
            </li>
            <li>
              <b>Cash on Delivery:</b> Money lands 2 days after rider returns cash.
            </li>
            <li>
              <b>On hold:</b> Buyer raised a return — money is paused until resolved.
            </li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
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
            Payout history · भुक्तानी इतिहास
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
                const s = statusLabel[r.status];
                return (
                  <tr key={i} style={{ borderTop: "1.5px solid var(--line-200)" }}>
                    <td style={{ padding: "14px 12px", fontWeight: 700 }}>{r.date}</td>
                    <td className="tnum" style={{ padding: "14px 12px" }}>
                      Rs. {r.cash.toLocaleString()}
                    </td>
                    <td className="tnum" style={{ padding: "14px 12px", color: "var(--danger)" }}>
                      − Rs. {r.fee.toLocaleString()}
                    </td>
                    <td
                      className="tnum"
                      style={{ padding: "14px 12px", color: "var(--success)", fontWeight: 800 }}
                    >
                      Rs. {r.net.toLocaleString()}
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
                        <span className="ne">{s.ne}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <Button variant="ghost" full icon="image">
            Save as PDF
          </Button>
          <Button variant="ghost" full icon="phone">
            Talk to support
          </Button>
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.7 Customer Chat ---------- */
export function SellerChat({ buyerMode = false }: { buyerMode?: boolean }) {
  const { toast } = useBz();
  const { data: inbox, isLoading, isError, error } = useChatInbox();
  const { invalidateInbox, invalidateMessages } = useInvalidateChat();
  const CHAT_THREADS = inbox?.threads ?? [];
  const CHAT_QUICK_REPLIES = inbox?.quickReplies ?? [];
  const [active, setActive] = useState<ChatThread | null>(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: msgPage, isLoading: msgsLoading } = useChatMessages(active?.id ?? null);

  useEffect(() => {
    if (CHAT_THREADS.length && !active) setActive(CHAT_THREADS[0] ?? null);
  }, [CHAT_THREADS, active]);

  useEffect(() => {
    if (!buyerMode || typeof sessionStorage === "undefined") return;
    const sellerId = sessionStorage.getItem("bz_open_chat_seller");
    if (!sellerId) return;
    sessionStorage.removeItem("bz_open_chat_seller");
    void chatApi
      .createConversation(sellerId)
      .then((thread) => {
        setActive(thread);
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
    if (!active?.id || sending) return;
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    setSending(true);
    try {
      const clientMessageId =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
      const sent = await sendChatMessageSocket(active.id, {
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
      appendMessage(sent);
      setMsg("");
      emitTypingStop(active.id);
      void invalidateInbox();
      void invalidateMessages(active.id);
    } catch (e) {
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
        thumbnailUrl: "thumbnailUrl" in uploaded ? uploaded.thumbnailUrl : uploaded.url,
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

  if (!CHAT_THREADS.length) {
    return (
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        {!buyerMode ? <SellerHelpBar /> : null}
        <EmptyState
          title="No conversations yet"
          message="When buyers message you, chats will appear here."
        />
      </div>
    );
  }

  if (!active) {
    return (
      <ApiState isLoading>
        <div />
      </ApiState>
    );
  }

  return (
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      {!buyerMode ? <SellerHelpBar /> : null}
      <div
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
            {buyerMode ? "Messages" : "Chat"}{" "}
            <span
              className="ne"
              style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
            >
              · च्याट
            </span>
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
            Reply fast. Buyers who wait &gt; 1hr usually leave.
          </p>
        </div>
        <Button
          variant="secondary"
          icon="edit"
          size="sm"
          onClick={() => toast("Edit quick replies — coming soon")}
        >
          Edit quick replies
        </Button>
      </div>

      <div className="bz-chat-shell">
        {/* Threads list */}
        <aside
          style={{
            borderRight: "1px solid var(--line-200)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {CHAT_THREADS.map((t) => {
            const sel = active.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActive(t);
                  setMessages([]);
                  setPeerTyping(false);
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
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: TINTS[t.tone][0],
                    color: TINTS[t.tone][2],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {t.avatar}
                </div>
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
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--line-200)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: TINTS[active.tone][0],
                color: TINTS[active.tone][2],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              {active.avatar}
            </div>
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
              }}
            >
              <Icon name="phone" size={18} color="#fff" />
            </a>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              background: "#f7f8fb",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {msgsLoading && !messages.length ? (
              <div style={{ textAlign: "center", color: "var(--ink-400)", fontSize: ".8125rem" }}>
                Loading messages...
              </div>
            ) : null}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "75%" }}
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
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--line-200)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              background: "#fff",
            }}
          >
            {CHAT_QUICK_REPLIES.map((q) => (
              <button
                key={q.en}
                onClick={() => send(q.en)}
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
          <div
            style={{
              padding: 10,
              borderTop: "1px solid var(--line-200)",
              display: "flex",
              gap: 8,
              background: "#fff",
            }}
          >
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
              placeholder="Type a message · सन्देश लेख्नुहोस्"
              style={{
                flex: 1,
                height: 44,
                padding: "0 14px",
                border: "1.5px solid var(--line-200)",
                borderRadius: 999,
                fontSize: ".9375rem",
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
            />
            <button
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
      </div>
    </div>
  );
}

function fmtRs(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
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
  const { toast } = useBz();
  const { data: BARGAIN_OFFERS = [], isLoading, isError, error } = useSellerBargains();
  const [maxPct, setMaxPct] = useState(12);
  const [enabled, setEnabled] = useState(true);

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Bargaining{" "}
          <span
            className="ne"
            style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
          >
            · मोलतोल
          </span>
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          Buyers can send you offers below your listed price. You decide the maximum discount.
          Buyers can&apos;t see this limit.
        </p>

        {/* Max bargain setter */}
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--line-200)",
            borderRadius: "var(--r-lg)",
            padding: 22,
            boxShadow: "var(--sh-1)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: ".8125rem", fontWeight: 600, color: "var(--ink-700)" }}>
                Maximum bargain you allow
              </div>
              <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-400)" }}>
                तपाईंले दिने अधिकतम छुट
              </div>
            </div>
            <label
              style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--blue)" }}
              />
              <span style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-700)" }}>
                Accept offers
              </span>
            </label>
          </div>
          <div
            className="tnum bz-stat-xl"
            style={{
              fontWeight: 800,
              lineHeight: 1,
              margin: "8px 0 12px",
              color: "var(--blue-deep)",
            }}
          >
            {maxPct}%
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={maxPct}
            onChange={(e) => setMaxPct(parseInt(e.target.value))}
            disabled={!enabled}
            style={{ width: "100%", accentColor: "var(--blue)", opacity: enabled ? 1 : 0.5 }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: ".7rem",
              color: "var(--ink-400)",
              marginTop: 4,
            }}
          >
            <span>0% (fixed price)</span>
            <span>15%</span>
            <span>30%</span>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: 10,
              background: "var(--tint-blue-50)",
              borderRadius: "var(--r-md)",
              fontSize: ".8125rem",
              color: "var(--ink-700)",
            }}
          >
            <Icon
              name="shieldCheck"
              size={14}
              color="var(--blue)"
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            Buyers see only &quot;Make an offer&quot; — never your limit. Offers above {maxPct}% are
            auto-rejected.
          </div>
        </div>

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
              discount?: number;
              listed?: number;
              offered?: number;
              yourOffer?: number;
            }>;
            const total = offers.length;
            const accepted = offers.filter((o) => bargainStatus(o) === "accepted").length;
            const acceptPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
            const discounts = offers.map((o) => Number(o.discount) || 0).filter((d) => d > 0);
            const avgDisc = discounts.length
              ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
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
              { v: `${avgDisc}%`, k: "Average discount", c: "var(--saffron)" },
              { v: `Rs. ${margin.toLocaleString()}`, k: "Margin given", c: "var(--danger)" },
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
          Offers · प्रस्ताव
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BARGAIN_OFFERS.map((o) => {
            const status = bargainStatus(o);
            const listed = Number(o.listed) || 0;
            const offered = Number(o.offered ?? o.yourOffer) || 0;
            const discount = Number(o.discount) || 0;
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
                <Placeholder
                  icon={o.icon}
                  tint={o.tint}
                  style={{ width: 56, height: 56, flexShrink: 0 }}
                  radius="var(--r-md)"
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
                    <span
                      style={{
                        color: discount > maxPct ? "var(--danger)" : "var(--success)",
                        fontWeight: 700,
                      }}
                    >
                      −{discount}%
                    </span>
                  </div>
                  {status === "pending" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Button variant="primary" size="sm" onClick={() => toast("Offer accepted")}>
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toast("Counter offer sent")}
                      >
                        Counter
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => toast("Offer rejected")}>
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

/* ---------- 4.9 Promotions ---------- */
export function SellerPromotions() {
  const { toast } = useBz();
  const { data: promos, isLoading, isError, error } = useSellerPromotions();
  const [activeTab, setActiveTab] = useState("active");
  const promoTypes = promos?.promoTypes ?? [];
  const active = promos?.active ?? [];

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Promotions{" "}
          <span
            className="ne"
            style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
          >
            · छुट
          </span>
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          Move slow stock. Reward repeat buyers. Get a sales bump for a few days.
        </p>

        <h2 style={{ margin: "0 0 10px", fontSize: "1rem", fontWeight: 800 }}>
          Start a new promotion
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {promoTypes.map((p) => (
            <button
              key={p.id}
              onClick={() => toast(`${p.en} wizard — coming soon`)}
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--r-md)",
                  background: "var(--tint-red-50)",
                  color: "var(--red)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={p.icon} size={22} color="var(--red)" />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{p.en}</div>
                <div className="ne" style={{ fontSize: ".75rem", color: "var(--ink-500)" }}>
                  {p.ne}
                </div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-700)", marginTop: 6 }}>
                  {p.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[
            { id: "active", label: `Active (${active.length})` },
            { id: "scheduled", label: "Scheduled (0)" },
            { id: "ended", label: "Ended (4)" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "8px 14px",
                background: activeTab === t.id ? "var(--ink-900)" : "#fff",
                color: activeTab === t.id ? "#fff" : "var(--ink-700)",
                border: `1.5px solid ${activeTab === t.id ? "var(--ink-900)" : "var(--line-200)"}`,
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: ".8125rem",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {active.map((p) => (
            <div
              key={p.name}
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 14,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span style={{ width: 6, height: 60, background: p.color, borderRadius: 3 }} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: ".7rem",
                    color: "var(--ink-500)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}
                >
                  {p.type}
                </div>
                <div style={{ fontWeight: 800, marginTop: 2 }}>{p.name}</div>
                <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 2 }}>
                  Ends {p.ends} ·{" "}
                  <span className="tnum">
                    {p.uses}/{p.max}
                  </span>{" "}
                  uses
                </div>
              </div>
              <Button variant="ghost" size="sm" icon="edit">
                Edit
              </Button>
              <Button variant="danger" size="sm" icon="trash">
                Stop
              </Button>
            </div>
          ))}
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.10 Reviews ---------- */
export function SellerReviews() {
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
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Reviews{" "}
          <span
            className="ne"
            style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
          >
            · समीक्षा
          </span>
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          Reply to every review. Buyers trust shops that listen.
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

        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
          {[
            { id: "all", label: "All" },
            { id: "unreplied", label: "Needs reply" },
            { id: "low", label: "Low (≤ 3★)" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              style={{
                padding: "8px 14px",
                background: filter === t.id ? "var(--ink-900)" : "#fff",
                color: filter === t.id ? "#fff" : "var(--ink-700)",
                border: `1.5px solid ${filter === t.id ? "var(--ink-900)" : "var(--line-200)"}`,
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: ".8125rem",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
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
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--tint-blue-50)",
                    color: "var(--blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                  }}
                >
                  {r.buyer[0]}
                </div>
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
  const { toast } = useBz();
  const { data: storefront, isLoading, isError, error } = useSellerStorefront();
  const updateStorefront = useUpdateStorefront();
  const uploadLogo = useUploadStorefrontLogo();
  const uploadBanner = useUploadStorefrontBanner();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [blocks, setBlocks] = useState([]);
  const [about, setAbout] = useState("");
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    if (!storefront) return;
    if (storefront.blocks) setBlocks(storefront.blocks);
    setAbout(storefront.about ?? "");
    setShopName(storefront.shopName ?? "");
  }, [storefront]);

  const logoUrl = storefront?.logoUrl;
  const bannerUrl = storefront?.bannerUrl;
  const busy = updateStorefront.isPending || uploadLogo.isPending || uploadBanner.isPending;

  const pickImage = async (file: File, kind: "logo" | "banner") => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast("Use JPEG, PNG, or WebP");
      return;
    }
    try {
      if (kind === "logo") {
        await uploadLogo.mutateAsync(file);
        toast("Logo updated");
      } else {
        await uploadBanner.mutateAsync(file);
        toast("Banner updated");
      }
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
    try {
      await updateStorefront.mutateAsync({ about, blocks, shopName: trimmedName });
      toast("Storefront published — buyers see it now");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save storefront");
    }
  };

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Storefront{" "}
          <span
            className="ne"
            style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
          >
            · पसल सजावट
          </span>
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          Customize how buyers see your shop. Changes go live in 5 minutes.
        </p>

        <div className="bz-seller-grid" style={{ maxWidth: 560 }}>
          <div>
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>
                Shop logo &amp; banner
              </h3>
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
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt=""
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid var(--line-200)",
                    }}
                  />
                ) : (
                  <Placeholder
                    icon="store"
                    tint="red"
                    style={{ width: 64, height: 64 }}
                    radius="50%"
                  />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  icon="image"
                  disabled={busy}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploadLogo.isPending ? "Uploading…" : "Change logo"}
                </Button>
              </div>
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: 100,
                    objectFit: "cover",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--line-200)",
                  }}
                />
              ) : (
                <Placeholder
                  icon="image"
                  tint="blue"
                  style={{ width: "100%", height: 100 }}
                  radius="var(--r-md)"
                />
              )}
              <Button
                variant="secondary"
                size="sm"
                icon="image"
                disabled={busy}
                onClick={() => bannerInputRef.current?.click()}
                style={{ marginTop: 8 }}
              >
                {uploadBanner.isPending ? "Uploading…" : "Change banner"}
              </Button>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: "0 0 4px", fontSize: ".9375rem", fontWeight: 800 }}>
                Store name · पसलको नाम
              </h3>
              <p style={{ margin: "0 0 12px", fontSize: ".75rem", color: "var(--ink-500)" }}>
                This is what buyers see. Your owner name stays private — edit it in Profile.
              </p>
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
            </div>

            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>
                About us
              </h3>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell buyers your story. e.g. Family-run handicraft shop in Bhaktapur since 2018..."
                style={{
                  width: "100%",
                  minHeight: 80,
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

            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 16,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>
                Sections
              </h3>
              {blocks.map((b, i) => (
                <label
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: i < blocks.length - 1 ? "1px dashed var(--line-200)" : "none",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={b.enabled}
                    onChange={() =>
                      setBlocks((arr) =>
                        arr.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x)),
                      )
                    }
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ flex: 1, fontWeight: 600 }}>{b.en}</span>
                </label>
              ))}
            </div>

            <Button
              variant="primary"
              size="lg"
              full
              disabled={busy}
              onClick={() => void publish()}
              style={{ marginTop: 14 }}
            >
              {updateStorefront.isPending ? "Publishing…" : "Publish changes"}
            </Button>
          </div>
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- 4.12 Videos ---------- */
export function SellerVideos() {
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
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--ink-600)",
          }}
        >
          <Icon name="video" size={32} color="var(--ink-400)" />
          <p style={{ margin: "12px 0 0", fontSize: ".9375rem", fontWeight: 600 }}>
            Complete verification to add and manage videos
          </p>
          <p
            className="ne"
            style={{ margin: "6px 0 0", fontSize: ".75rem", color: "var(--ink-500)" }}
          >
            भिडियो थप्न र व्यवस्थापन गर्न प्रमाणीकरण पूरा गर्नुहोस्
          </p>
        </div>
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
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
  { en: "New order", ne: "नयाँ अर्डर", defaults: [true, true, true, false] },
  { en: "Bargain offer", ne: "मोलतोल", defaults: [true, false, true, false] },
  { en: "Low stock", ne: "सामान कम", defaults: [true, false, true, false] },
  { en: "New review", ne: "नयाँ समीक्षा", defaults: [true, false, false, false] },
  { en: "Payout sent", ne: "पैसा पठाइयो", defaults: [true, true, true, true] },
  { en: "Policy update", ne: "नीति परिवर्तन", defaults: [true, false, false, true] },
];
export const NOTIF_CHANNELS = [
  { en: "In-app", icon: "bell" },
  { en: "SMS", icon: "message" },
  { en: "WhatsApp", icon: "headphones" },
  { en: "Email", icon: "file" },
];

export function SellerSettings() {
  const { toast, nav } = useBz();
  const user = useBazaarStore((s) => s.user);
  const { data: organization } = useSellerOrganization();
  const { data: notifications } = useSellerNotifications();
  const {
    data: settings,
    isLoading,
    isError,
    error,
  } = useSellerSettings(organization?.linked === true);
  const updateSettings = useUpdateSellerSettings();
  const [tab, setTab] = useState("shop");
  const [shopRules, setShopRules] = useState(null);
  const [notif, setNotif] = useState(null);
  const [language, setLanguage] = useState("both");

  useEffect(() => {
    if (!settings) return;
    setShopRules({ ...settings.shopRules });
    setNotif(settings.alertMatrix.map((row) => [...row]));
    setLanguage(settings.account.language);
  }, [settings]);

  const toggleZone = (zone) => {
    setShopRules((prev) => {
      if (!prev) return prev;
      const has = prev.shippingZones.includes(zone);
      const next = has
        ? prev.shippingZones.filter((z) => z !== zone)
        : [...prev.shippingZones, zone];
      return { ...prev, shippingZones: next.length > 0 ? next : [zone] };
    });
  };

  const handleSave = async () => {
    if (!shopRules || !notif) return;
    try {
      await updateSettings.mutateAsync({
        shopRules,
        alertMatrix: notif,
        account: { language },
      });
      toast("Settings saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save settings");
    }
  };

  const ready = shopRules && notif;

  if (organization && !organization.linked) {
    return (
      <div className="bz-seller-page">
        <SellerHelpBar />
        <p style={{ color: "var(--ink-600)" }}>
          Complete seller onboarding to configure shop rules and alerts.
        </p>
        <Button variant="primary" href={pathFromScreen("s-onboarding")}>
          Go to onboarding
        </Button>
      </div>
    );
  }

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div className="bz-seller-page" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          Settings{" "}
          <span
            className="ne"
            style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}
          >
            · सेटिङ
          </span>
        </h1>
        <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
          Set up your shop rules and how we send you alerts.
        </p>

        {/* Big icon-tab switcher */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {[
            { id: "shop", icon: "store", en: "Shop rules", ne: "पसलका नियम" },
            { id: "alerts", icon: "bell", en: "Alerts", ne: "सूचना" },
            { id: "account", icon: "lock", en: "Account", ne: "खाता" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: active ? "var(--tint-red-50)" : "#fff",
                  border: `1.5px solid ${active ? "var(--red)" : "var(--line-200)"}`,
                  color: active ? "var(--red)" : "var(--ink-700)",
                  borderRadius: "var(--r-md)",
                  padding: "14px 10px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 700,
                }}
              >
                <Icon name={t.icon} size={22} color={active ? "var(--red)" : "var(--ink-700)"} />
                <div style={{ fontSize: ".875rem" }}>{t.en}</div>
                <div
                  className="ne"
                  style={{ fontSize: ".7rem", color: "var(--ink-500)", fontWeight: 600 }}
                >
                  {t.ne}
                </div>
              </button>
            );
          })}
        </div>

        {tab === "shop" && ready && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>
                Shop hours · खुल्ने समय
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label
                    style={{
                      fontSize: ".75rem",
                      color: "var(--ink-500)",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Open
                  </label>
                  <input
                    type="time"
                    value={shopRules.openTime}
                    onChange={(e) => setShopRules((s) => ({ ...s, openTime: e.target.value }))}
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "0 12px",
                      border: "1.5px solid var(--line-200)",
                      borderRadius: "var(--r-md)",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: ".75rem",
                      color: "var(--ink-500)",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Close
                  </label>
                  <input
                    type="time"
                    value={shopRules.closeTime}
                    onChange={(e) => setShopRules((s) => ({ ...s, closeTime: e.target.value }))}
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "0 12px",
                      border: "1.5px solid var(--line-200)",
                      borderRadius: "var(--r-md)",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>
                Return policy · फिर्ता नीति
              </h3>
              <select
                value={String(shopRules.returnDays)}
                onChange={(e) =>
                  setShopRules((s) => ({ ...s, returnDays: parseInt(e.target.value, 10) }))
                }
                style={{
                  width: "100%",
                  height: 44,
                  padding: "0 12px",
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontFamily: "var(--font-sans)",
                  marginBottom: 10,
                  color: "var(--ink-900)",
                  fontWeight: 600,
                }}
              >
                <option value="0">No returns</option>
                <option value="3">3-day return</option>
                <option value="7">7-day return (recommended)</option>
                <option value="14">14-day return</option>
              </select>
              <textarea
                value={shopRules.returnNotes}
                onChange={(e) => setShopRules((s) => ({ ...s, returnNotes: e.target.value }))}
                placeholder="Notes for buyers about returns…"
                style={{
                  width: "100%",
                  minHeight: 60,
                  padding: 10,
                  border: "1.5px solid var(--line-200)",
                  borderRadius: "var(--r-md)",
                  fontFamily: "var(--font-sans)",
                  fontSize: ".875rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: ".9375rem", fontWeight: 800 }}>
                Where you ship · डेलिभरी क्षेत्र
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 8,
                }}
              >
                {SHIPPING_ZONES.map((z) => (
                  <label
                    key={z}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: 10,
                      border: "1px solid var(--line-200)",
                      borderRadius: "var(--r-md)",
                      cursor: "pointer",
                      fontSize: ".875rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={shopRules.shippingZones.includes(z)}
                      onChange={() => toggleZone(z)}
                      style={{ width: 18, height: 18, accentColor: "var(--red)" }}
                    />
                    {z}
                  </label>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: ".9375rem", fontWeight: 800 }}>
                  Shop on holiday · बिदामा
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}>
                  Hide all listings without losing data. Switch back anytime.
                </p>
              </div>
              <label
                style={{ position: "relative", width: 52, height: 30, display: "inline-block" }}
              >
                <input
                  type="checkbox"
                  checked={shopRules.holidayMode}
                  onChange={(e) => setShopRules((s) => ({ ...s, holidayMode: e.target.checked }))}
                  style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: shopRules.holidayMode ? "var(--red)" : "var(--line-200)",
                    borderRadius: 999,
                    cursor: "pointer",
                    transition: "background .2s",
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {tab === "alerts" && notif && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: ".875rem", color: "var(--ink-500)" }}>
              Pick how we tell you about each thing. New-order alerts are always on.
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
                  Recent alerts
                </div>
                {notifications.items.map((n) => (
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
                      Tell me about
                    </th>
                    {NOTIF_CHANNELS.map((c) => (
                      <th
                        key={c.en}
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
                          <Icon name={c.icon} size={14} /> {c.en}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {NOTIF_EVENTS.map((e, ri) => (
                    <tr key={e.en} style={{ borderTop: "1px solid var(--line-200)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700 }}>{e.en}</div>
                        <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                          {e.ne}
                        </div>
                      </td>
                      {NOTIF_CHANNELS.map((_, ci) => (
                        <td key={ci} style={{ padding: "14px 12px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={notif[ri][ci]}
                            disabled={ri === 0 && ci === 0}
                            onChange={() =>
                              setNotif((s) =>
                                s.map((row, i) =>
                                  i === ri ? row.map((v, j) => (j === ci ? !v : v)) : row,
                                ),
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
              { icon: "lock", en: "Password", sub: "Managed via sign-in" },
              { icon: "mail", en: "Email", sub: user?.email ?? "—" },
              {
                icon: "image",
                en: "Profile photo",
                sub: "Upload your face — buyers trust real people",
              },
              {
                icon: "palette",
                en: "Language",
                sub:
                  language === "en" ? "English" : language === "ne" ? "नेपाली" : "English + नेपाली",
              },
            ].map((r, i, a) => (
              <div
                key={r.en}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  background: "#fff",
                  borderBottom: i < a.length - 1 ? "1px solid var(--line-200)" : "none",
                }}
              >
                <Icon name={r.icon} size={22} color="var(--ink-700)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{r.en}</div>
                  {r.en === "Language" ? (
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{
                        marginTop: 6,
                        width: "100%",
                        height: 40,
                        border: "1.5px solid var(--line-200)",
                        borderRadius: "var(--r-md)",
                        fontFamily: "var(--font-sans)",
                        color: "var(--ink-900)",
                        fontWeight: 600,
                      }}
                    >
                      <option value="both">English + नेपाली</option>
                      <option value="en">English</option>
                      <option value="ne">नेपाली</option>
                    </select>
                  ) : (
                    <div style={{ fontSize: ".8125rem", color: "var(--ink-500)" }}>{r.sub}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          full
          disabled={!ready || updateSettings.isPending}
          onClick={() => void handleSave()}
          style={{ marginTop: 18 }}
        >
          {updateSettings.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </ApiState>
  );
}

/* ---------- 4.18 Profile (includes KYC) ---------- */
export function SellerProfile() {
  const { nav, toast } = useBz();
  const logoutMutation = useLogout();
  const updateProfile = useUpdateProfile();
  const deleteMutation = useDeleteAccount();
  const user = useBazaarStore((s) => s.user);
  const { data: storefront } = useSellerStorefront();
  const shopName = (storefront as { shopName?: string })?.shopName?.trim() || "Your shop";
  const sellerName = displayName(user, "Seller");
  const kycItems: Array<{ en: string; ne: string; status: string; note: string }> = [];

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

  const handleDelete = () => {
    if (!canDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(requiresPassword ? { password: deletePassword } : undefined, {
      onSuccess: () => {
        closeDeleteModal();
        toast("Account deleted. We're sorry to see you go.");
        nav("home");
      },
      onError: (err) => {
        setDeleteError(err instanceof Error ? err.message : "Could not delete account");
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
    <div style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "20px 28px 100px" }}>
      <SellerHelpBar />
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--blue-deep)" }}>
        My profile{" "}
        <span className="ne" style={{ fontSize: "1rem", color: "var(--ink-500)", fontWeight: 600 }}>
          · प्रोफाइल
        </span>
      </h1>
      <p style={{ margin: "4px 0 18px", fontSize: ".875rem", color: "var(--ink-500)" }}>
        Your info, your shop documents, and the log-out button.
      </p>

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
        My info · मेरो जानकारी
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
          { icon: "lock", en: "Password", sub: "Managed via sign-in", onAct: undefined },
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

      {/* Shop documents (KYC) */}
      <h2
        style={{
          margin: "10px 0 8px",
          fontSize: ".9375rem",
          fontWeight: 800,
          color: "var(--blue-deep)",
        }}
      >
        <Icon
          name="shieldCheck"
          size={18}
          color="var(--success)"
          style={{ verticalAlign: "middle", marginRight: 6 }}
        />
        Shop documents · पसलका कागजात
      </h2>
      <p style={{ margin: "0 0 10px", fontSize: ".8125rem", color: "var(--ink-500)" }}>
        These prove your shop is real. Buyers see your verified badge.
      </p>
      <div
        style={{
          background: "#fff",
          border: "1.5px solid var(--line-200)",
          borderRadius: "var(--r-lg)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {kycItems.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ink-500)",
              fontSize: ".875rem",
            }}
          >
            No documents uploaded yet.
          </div>
        )}
        {kycItems.map((it, i) => (
          <div
            key={it.en}
            style={{
              padding: 14,
              borderBottom: i < kycItems.length - 1 ? "1px solid var(--line-200)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Icon
              name={it.status === "verified" ? "check" : "clock"}
              size={22}
              color={it.status === "verified" ? "var(--success)" : "var(--saffron)"}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: ".9375rem" }}>
                {it.en}{" "}
                <span
                  className="ne"
                  style={{ fontWeight: 600, color: "var(--ink-500)", fontSize: ".75rem" }}
                >
                  · {it.ne}
                </span>
              </div>
              <div style={{ fontSize: ".75rem", color: "var(--ink-500)", marginTop: 1 }}>
                {it.note}
              </div>
            </div>
            <Button variant="ghost" size="sm" icon="edit" onClick={() => toast(`Update ${it.en}`)}>
              Update
            </Button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Button
          variant="secondary"
          full
          onClick={() => logoutMutation.mutate(undefined, { onSuccess: () => nav("home") })}
        >
          Log out
        </Button>
        <Button variant="danger" full onClick={() => setConfirmDelete(true)}>
          Delete account
        </Button>
      </div>

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
            style={{
              background: "#fff",
              borderRadius: "var(--r-xl)",
              padding: 28,
              width: "100%",
              maxWidth: 460,
              boxShadow: "var(--sh-3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--ink-900)",
              }}
            >
              Delete your seller account?
            </h3>
            <p
              style={{
                margin: "0 0 14px",
                color: "var(--ink-500)",
                fontSize: ".9375rem",
                lineHeight: 1.5,
              }}
            >
              This is <b style={{ color: "var(--danger)" }}>permanent</b>. Your shop, all your
              product listings, reviews, and messages will be removed. If your products have any
              existing orders, deletion is blocked — contact support instead.
            </p>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: ".8125rem",
                fontWeight: 700,
                color: "var(--ink-700)",
              }}
            >
              Type <b style={{ color: "var(--danger)" }}>DELETE</b> to confirm
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
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
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
              <Button variant="ghost" full onClick={closeDeleteModal}>
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

/* ---------- NEW: Simple Analytics ("My shop") for non-tech 40+ users ---------- */

export function SellerAnalytics() {
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
            My shop
          </h1>
          <p
            className="ne"
            style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: ".95rem" }}
          >
            मेरो पसल — हालको हालचाल
          </p>
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
              Rs. {soldToday.toLocaleString()}
            </div>
            <div style={{ fontSize: ".8125rem", color: "var(--ink-400)" }}>
              Courier holding Rs. {withCourier.toLocaleString()}
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
                    Rs. {b.v.toLocaleString()}
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
                <p
                  className="ne"
                  style={{ margin: "4px 0 0", fontSize: ".8125rem", color: "var(--ink-500)" }}
                >
                  हप्ताभरको सारांश
                </p>
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
                ? `${bestDay.label} was your strongest day — Rs. ${bestDay.value.toLocaleString()} in sales.`
                : "Sales will show here once you start receiving orders."}
            </p>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
            >
              {[
                {
                  label: "7-day total",
                  value: `Rs. ${salesByDay.reduce((s, d) => s + d.value, 0).toLocaleString()}`,
                },
                {
                  label: "Daily average",
                  value: `Rs. ${Math.round(salesByDay.reduce((s, d) => s + d.value, 0) / Math.max(salesByDay.length, 1)).toLocaleString()}`,
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
            <p
              className="ne"
              style={{ margin: "0 0 18px", fontSize: ".8125rem", color: "var(--ink-500)" }}
            >
              ७ दिनको बिक्री
            </p>
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
            <p
              className="ne"
              style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}
            >
              मेरो पैसा कहाँ छ
            </p>
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
                        <span
                          className="ne"
                          style={{
                            marginLeft: 8,
                            color: "var(--ink-500)",
                            fontSize: ".75rem",
                            fontWeight: 600,
                          }}
                        >
                          {b.ne}
                        </span>
                      </div>
                      <span
                        className="tnum"
                        style={{ fontWeight: 800, fontSize: "1.05rem", color: b.c }}
                      >
                        Rs. {b.v.toLocaleString()}
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
                ? `Rs. ${withCourier.toLocaleString()} is with courier until delivery is confirmed.`
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
            <p
              className="ne"
              style={{ margin: "0 0 14px", fontSize: ".8125rem", color: "var(--ink-500)" }}
            >
              सबभन्दा बढी बिक्ने
            </p>
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
                    Rs. {p.rev.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p
            className="bz-seller-analytics-span-12"
            style={{ textAlign: "center", color: "var(--ink-500)", fontSize: ".875rem", margin: 0 }}
          >
            Want to know what to fix? Open <b>What to do · के गर्ने</b> in the sidebar.
          </p>
        </div>
      </div>
    </ApiState>
  );
}

/* ---------- NEW: Reports ("What to do") ---------- */

export function SellerReports() {
  const { toast, nav } = useBz();
  const { data: reports, isLoading, isError, error } = useSellerReports();
  const cards = reports?.cards ?? [];
  const downloads = reports?.downloads ?? [];

  return (
    <ApiState isLoading={isLoading} isError={isError} error={error}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 28px 100px" }}>
        <SellerHelpBar />
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--blue-deep)" }}>
          What to do this week
        </h1>
        <p
          className="ne"
          style={{ margin: "4px 0 4px", color: "var(--ink-500)", fontSize: ".95rem" }}
        >
          यो हप्ता के गर्ने
        </p>
        <p style={{ margin: "0 0 18px", color: "var(--ink-500)", fontSize: ".9rem" }}>
          Things to act on, and your reports to save or share.
        </p>

        {/* Downloads moved TO TOP — visible without scrolling */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--tint-blue-50) 0%, rgba(22,163,74,.06) 100%)",
            border: "1.5px solid var(--blue)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-md)",
                background: "var(--blue)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="download" size={22} color="#fff" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 800,
                  color: "var(--blue-deep)",
                }}
              >
                Get my reports
              </h2>
              <p
                className="ne"
                style={{ margin: "2px 0 0", color: "var(--ink-500)", fontSize: ".8125rem" }}
              >
                रिपोर्ट निकाल्नुहोस् — Tap one, we send it to your WhatsApp.
              </p>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
            }}
          >
            {downloads.map((d) => (
              <button
                key={d.en}
                onClick={() => toast(`${d.en} sent to WhatsApp · प्राप्त भयो`)}
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--blue)",
                  borderRadius: "var(--r-md)",
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Icon name={d.icon} size={22} color="var(--blue)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: ".9rem", color: "var(--ink-900)" }}>
                    {d.en}
                  </div>
                  <div className="ne" style={{ fontSize: ".7rem", color: "var(--ink-500)" }}>
                    {d.ne}
                  </div>
                </div>
                <Icon name="download" size={18} color="var(--blue)" />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
          }}
        >
          Things to act on
        </h2>
        <p
          className="ne"
          style={{ margin: "0 0 14px", color: "var(--ink-500)", fontSize: ".8125rem" }}
        >
          के-के गर्ने
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {cards.length === 0 && (
            <div
              style={{
                padding: 28,
                textAlign: "center",
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                color: "var(--ink-500)",
              }}
            >
              Nothing to act on right now. Suggestions appear when you have orders and inventory.
            </div>
          )}
          {cards.map((c) => (
            <div
              key={c.title}
              style={{
                background: "#fff",
                border: "1.5px solid var(--line-200)",
                borderRadius: "var(--r-lg)",
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "var(--r-md)",
                    background: "var(--line-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={c.icon} size={26} color={c.color} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.0625rem",
                      fontWeight: 800,
                      color: "var(--ink-900)",
                    }}
                  >
                    {c.title}
                  </h3>
                  <div
                    className="ne"
                    style={{ fontSize: ".8125rem", color: "var(--ink-500)", marginTop: 2 }}
                  >
                    {c.ne}
                  </div>
                  <p style={{ margin: "8px 0 0", color: "var(--ink-700)", fontSize: ".9rem" }}>
                    {c.sub}
                  </p>
                  {c.items.length > 0 && (
                    <ul
                      style={{
                        margin: "10px 0 0",
                        paddingLeft: 20,
                        color: "var(--ink-700)",
                        fontSize: ".875rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {c.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Button variant="primary" size="lg" full icon={c.icon} href={pathFromScreen(c.to)}>
                  {c.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ApiState>
  );
}
