"use client";

import { type OrderStatus } from "@/shared/lib/order-utils";

/* ---------- 4.3 Orders Inbox (Viber-style feed) ---------- */
export const INBOX_TONE: Record<OrderStatus, string> = {
  awaiting_payment: "saffron",
  payment_failed: "red",
  confirmed: "blue",
  seller_processing: "saffron",
  waiting_for_hub: "saffron",
  partially_received_at_hub: "blue",
  received_at_hub: "blue",
  verified: "blue",
  packed_together: "saffron",
  out_for_delivery: "blue",
  delivered: "success",
  completed: "success",
  cancelled: "neutral",
  refunded: "neutral",
  placed: "red",
  accepted: "blue",
  packaging_started: "saffron",
  ready_for_pickup: "saffron",
  picked_up: "blue",
  arrived_at_hub: "blue",
  shipped: "blue",
};
export const INBOX_LABEL: Record<OrderStatus, { en: string; icon: string }> = {
  awaiting_payment: { en: "Awaiting payment", icon: "clock" },
  payment_failed: { en: "Payment failed", icon: "alertCircle" },
  confirmed: { en: "Confirmed", icon: "check" },
  seller_processing: { en: "Processing", icon: "package" },
  waiting_for_hub: { en: "Waiting for hub", icon: "clock" },
  partially_received_at_hub: { en: "Partial at hub", icon: "mapPin" },
  received_at_hub: { en: "At hub", icon: "mapPin" },
  verified: { en: "Verified", icon: "check" },
  packed_together: { en: "Packed", icon: "package" },
  out_for_delivery: { en: "Out delivery", icon: "truck" },
  delivered: { en: "Delivered", icon: "check" },
  completed: { en: "Completed", icon: "check" },
  cancelled: { en: "Cancelled", icon: "x" },
  refunded: { en: "Refunded", icon: "arrowLeft" },
  placed: { en: "New order", icon: "package" },
  accepted: { en: "Accepted", icon: "check" },
  packaging_started: { en: "Packaging", icon: "package" },
  ready_for_pickup: { en: "Ready pickup", icon: "package" },
  picked_up: { en: "Picked up", icon: "truck" },
  arrived_at_hub: { en: "At hub", icon: "mapPin" },
  shipped: { en: "Shipped", icon: "truck" },
};

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
