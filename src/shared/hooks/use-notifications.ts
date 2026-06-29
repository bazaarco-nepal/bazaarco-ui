"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationsApi,
  type NotificationItem,
} from "@/shared/api/notifications";
import { queryKeys } from "@/shared/api/query-keys";

const POLL_INTERVAL_MS = 30_000;
const STALE_TIME = 15_000;

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => notificationsApi.list({ limit: 30 }),
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useNotificationCheck(enabled: boolean) {
  const qc = useQueryClient();
  const prevUnreadRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: queryKeys.notifications.check,
    queryFn: () => notificationsApi.check(),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!enabled || query.data == null) return;
    const prev = prevUnreadRef.current;
    const next = query.data.unreadCount;
    prevUnreadRef.current = next;
    if (prev !== null && next > prev) {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list });
    }
  }, [enabled, query.data, qc]);

  return query;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (updated) => {
      qc.setQueryData<{ items: NotificationItem[] } | undefined>(
        queryKeys.notifications.list,
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((n) => (n.id === updated.id ? updated : n)),
          };
        },
      );
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.check });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.setQueryData<{ items: NotificationItem[] } | undefined>(
        queryKeys.notifications.list,
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((n) => ({ ...n, isRead: true })),
          };
        },
      );
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.check });
    },
  });
}

export function useNotificationUnreadCount(enabled: boolean) {
  const check = useNotificationCheck(enabled);
  return check.data?.unreadCount ?? 0;
}
