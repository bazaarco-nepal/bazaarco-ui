"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, Button } from "@/shared/ui/kit";
import type { NotificationItem, NotificationType } from "@/shared/api/notifications";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCheck,
  useNotifications,
} from "@/shared/hooks/use-notifications";

function formatNotificationTime(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${String(mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${String(days)}d ago`;
  return new Date(iso).toLocaleDateString(locale === "ne" ? "ne-NP" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

function typeLabel(type: NotificationType, t: (key: string) => string): string {
  const key = `notifications.types.${type}`;
  const label = t(key);
  return label === key ? type : label;
}

function NotificationRow({
  item,
  locale,
  onRead,
  busy,
}: {
  item: NotificationItem;
  locale: string;
  onRead: (id: string) => void;
  busy: boolean;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`bz-notif-panel__item${item.isRead ? "" : " is-unread"}`}
      onClick={() => {
        if (!item.isRead) onRead(item.id);
      }}
      disabled={busy}
    >
      <div className="bz-notif-panel__item-head">
        <span className="bz-notif-panel__item-title">{item.title}</span>
        {!item.isRead && <span className="bz-notif-panel__dot" aria-hidden />}
      </div>
      <p className="bz-notif-panel__item-msg">{item.message}</p>
      <div className="bz-notif-panel__item-meta">
        <span className="bz-notif-panel__type">{typeLabel(item.type, t)}</span>
        <span className="bz-notif-panel__time">{formatNotificationTime(item.createdAt, locale)}</span>
      </div>
    </button>
  );
}

export interface NotificationBellProps {
  authed: boolean;
  locale: string;
  /** Navy header (buyer) vs light seller chrome */
  variant?: "navbar" | "seller";
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
}

export function NotificationBell({
  authed,
  locale,
  variant = "navbar",
  className = "",
  iconSize = 22,
  showLabel = false,
}: NotificationBellProps) {
  const { t } = useTranslation();
  const enabled = authed;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const checkQuery = useNotificationCheck(enabled);
  const unreadCount = checkQuery.data?.unreadCount ?? 0;
  const { data, isLoading, isError, error, refetch } = useNotifications(enabled && open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const badge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!authed) return null;

  const iconColor = variant === "navbar" ? "var(--on-navy-300)" : "var(--ink-700)";
  const triggerClass =
    variant === "navbar"
      ? `bz-navbar__action bz-notif-bell${open ? " is-open" : ""}`
      : `bz-notif-bell bz-notif-bell--seller${open ? " is-open" : ""}`;

  const items = data?.items ?? [];
  const busy = markRead.isPending || markAllRead.isPending;

  return (
    <div ref={wrapRef} className={`bz-notif-bell-wrap${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("notifications.bellAria")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="bz-navbar__action-ic">
          <Icon name="bell" size={iconSize} color={iconColor} />
          {badge && <span className="bz-navbar__action-badge">{badge}</span>}
        </span>
        {showLabel && (
          <span className="bz-navbar__action-text">
            <span className="bz-navbar__action-cap">{t("notifications.label")}</span>
            <span className="bz-navbar__action-main">{t("notifications.updates")}</span>
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="bz-notif-panel" aria-label={t("notifications.panelAria")}>
          <div className="bz-notif-panel__head">
            <span className="bz-notif-panel__title">{t("notifications.title")}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="bz-notif-panel__mark-all"
                disabled={busy}
                onClick={() => markAllRead.mutate()}
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="bz-notif-panel__body">
            {isLoading && (
              <div className="bz-notif-panel__state">{t("notifications.loading")}</div>
            )}
            {isError && (
              <div className="bz-notif-panel__state bz-notif-panel__state--error">
                <p>{error instanceof Error ? error.message : t("notifications.error")}</p>
                <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                  {t("notifications.retry")}
                </Button>
              </div>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <div className="bz-notif-panel__state">
                <Icon name="bell" size={28} color="var(--ink-300)" />
                <p>{t("notifications.empty")}</p>
              </div>
            )}
            {!isLoading &&
              !isError &&
              items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  busy={busy}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
