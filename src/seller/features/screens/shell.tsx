"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IconOverrideContext } from "@/components/ui";
import { SellerIcon } from "@/seller/ui/icons";
import { SellerVerificationBanner } from "@/seller/components/seller-verification-banner";
import { StoreSwitcherChip } from "../store-switcher";
import { useLogout } from "@/hooks/use-auth";
import { isSellerOnboardingDeferred } from "@/lib/seller-onboarding";
import { type SellerStoreSummary } from "@/seller/api/seller-organization";
import { useSellerInbox, useSellerBargains, useSellerOrganization } from "@/seller/hooks/use-seller";
import { useChatInbox } from "@/hooks/use-chat";
import { useBz, LogoutConfirmModal, LanguageToggle } from "@/components/common";
import { connectChatSocket } from "@/lib/chat-socket";
import { useInvalidateChat } from "@/hooks/use-chat";
import { bargainStatus } from "../_shared/bargain";
import { SELLER_NAV } from "../_shared/nav";
import { type SellerInboxOrderItem } from "../_shared/types";

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
                <SellerIcon name="chevronRight" size={14} />
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
                <SellerIcon name="chevronLeft" size={14} />
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
                    <SellerIcon
                      name={it.icon}
                      size={20}
                      color={active ? "var(--blue)" : "var(--ink-500)"}
                      filled={active}
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
          <div className="bz-side-lang">
            <span className="bz-side-en">{t("language.label")}</span>
            <LanguageToggle compact />
          </div>
          <button
            className="bz-side-item bz-side-logout"
            onClick={() => setConfirmLogout(true)}
            title={t("seller.logOut")}
          >
            <SellerIcon name="logout" size={20} color="var(--ink-500)" />
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
        skin="fluent"
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
  const { invalidateInbox } = useInvalidateChat();
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
    const socket = connectChatSocket();
    const onInboxUpdated = () => {
      void invalidateInbox();
    };
    socket.on("inbox_updated", onInboxUpdated);
    socket.on("message_new", onInboxUpdated);
    return () => {
      socket.off("inbox_updated", onInboxUpdated);
      socket.off("message_new", onInboxUpdated);
    };
  }, [invalidateInbox]);

  useEffect(() => {
    if (orgLoading || screen === "s-onboarding") return;
    if (organization && !organization.linked && !isSellerOnboardingDeferred()) {
      nav("s-onboarding");
    }
  }, [organization, orgLoading, screen, nav]);

  // The store switcher shows (and lists) the active store. A single-store seller
  // may not have that store echoed in `organization.stores` — the organization's
  // own identity *is* the active store — so synthesise it when missing. Without
  // this the chip falls back to the generic "BazaarCo" label instead of the real
  // store name.
  const sidebarStores = useMemo<SellerStoreSummary[]>(() => {
    const list = organization?.stores ?? [];
    const activeId = organization?.sellerId;
    if (activeId && organization?.shopName && !list.some((s) => s.sellerId === activeId)) {
      return [
        {
          sellerId: activeId,
          shopName: organization.shopName,
          city: organization.city,
          logoUrl: organization.logoUrl,
          verified: organization.verified,
        },
        ...list,
      ];
    }
    return list;
  }, [organization]);

  const renderFluentIcon = React.useCallback(
    (props: {
      name: string;
      size?: number;
      color?: string;
      style?: React.CSSProperties;
      className?: string;
    }) => (
      <SellerIcon
        name={props.name}
        size={props.size}
        color={props.color}
        style={props.style}
        className={props.className}
      />
    ),
    [],
  );

  return (
    <IconOverrideContext.Provider value={renderFluentIcon}>
      <div className={"bz-seller-shell" + (collapsed ? " collapsed" : "")} data-skin="fluent">
        <SellerSidebar
          screen={screen}
          onNav={nav}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          openMobile={openMobile}
          setOpenMobile={setOpenMobile}
          badges={badges}
          stores={sidebarStores}
          activeSellerId={organization?.sellerId ?? null}
        />
        <section className="bz-side-content">
          <div className="bz-side-mobile-bar">
            <button
              onClick={() => setOpenMobile(true)}
              aria-label={t("seller.menu")}
              className="bz-hover-border"
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
              <SellerIcon name="menu" size={22} />
            </button>
            {/* Active-store chip is the primary identity on mobile and opens the
              switcher bottom sheet without having to open the nav drawer. */}
            <StoreSwitcherChip
              variant="mobilebar"
              stores={sidebarStores}
              activeSellerId={organization?.sellerId ?? null}
            />
          </div>
          {organization?.linked &&
            organization.verification &&
            organization.verification.status !== "approved" && (
              <div
                className="bz-container-pad"
                style={{
                  maxWidth: "var(--seller-max, var(--container))",
                  margin: "0 auto",
                  padding: "16px 28px 0",
                }}
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
    </IconOverrideContext.Provider>
  );
}
