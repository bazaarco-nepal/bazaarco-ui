import { getData, patchData } from "@/shared/api/http";
import type { PaginatedData } from "@/shared/api/types";

export type NotificationType =
  | "user"
  | "maintenance"
  | "seller"
  | "order"
  | "bargain"
  | "system";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface NotificationCheckResult {
  hasNewNotifications: boolean;
  unreadCount: number;
  latestNotificationTimestamp: string | null;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
}

export const notificationsApi = {
  list(params: ListNotificationsParams = {}): Promise<PaginatedData<NotificationItem>> {
    return getData<PaginatedData<NotificationItem>>("/notifications", params);
  },

  check(): Promise<NotificationCheckResult> {
    return getData<NotificationCheckResult>("/notifications/check");
  },

  markRead(id: string): Promise<NotificationItem> {
    return patchData<NotificationItem>(`/notifications/${id}/read`);
  },

  markAllRead(): Promise<{ markedCount: number }> {
    return patchData<{ markedCount: number }>("/notifications/read-all");
  },
};
