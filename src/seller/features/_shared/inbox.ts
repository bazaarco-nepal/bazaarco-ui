"use client";

import { type SuborderStatus } from "@/shared/lib/order-utils";

/* ---------- 4.3 Orders Inbox (Viber-style feed) ---------- */
// Keyed by the orders service `SuborderStatus` the /seller/inbox endpoint returns
// (plus legacy/order-level values kept for older records). Look statuses up via
// `inboxLabel`/`inboxTone` so an unknown status never crashes the inbox.
export const INBOX_TONE: Record<string, string> = {
  awaiting_payment: "saffron",
  payment_failed: "red",
  confirmed: "blue",
  new_order: "red",
  seller_processing: "saffron",
  ready_for_hub: "saffron",
  on_the_way_to_hub: "blue",
  waiting_for_hub: "saffron",
  partially_received_at_hub: "blue",
  received_at_hub: "blue",
  verified: "blue",
  issue_found: "red",
  packed: "saffron",
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
export const INBOX_LABEL: Record<string, { en: string; icon: string }> = {
  awaiting_payment: { en: "Awaiting payment", icon: "clock" },
  payment_failed: { en: "Payment failed", icon: "alertCircle" },
  confirmed: { en: "Confirmed", icon: "check" },
  new_order: { en: "New order", icon: "package" },
  seller_processing: { en: "Processing", icon: "package" },
  ready_for_hub: { en: "Ready for hub", icon: "package" },
  on_the_way_to_hub: { en: "On the way to hub", icon: "truck" },
  waiting_for_hub: { en: "Waiting for hub", icon: "clock" },
  partially_received_at_hub: { en: "Partial at hub", icon: "mapPin" },
  received_at_hub: { en: "At hub", icon: "mapPin" },
  verified: { en: "Verified", icon: "check" },
  issue_found: { en: "Issue found", icon: "alertCircle" },
  packed: { en: "Packed", icon: "package" },
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

// Inbox tab/kanban grouping over SuborderStatus. `awaiting_payment` and
// `payment_failed` sub-orders are filtered out server-side, so they're omitted.
export const INBOX_TAB_STATUSES: Record<string, SuborderStatus[]> = {
  new: ["new_order"],
  processing: ["seller_processing", "ready_for_hub", "issue_found"],
  shipped: ["on_the_way_to_hub", "received_at_hub", "verified"],
  completed: ["packed"],
  cancelled: ["cancelled"],
};

export const SELLER_BOARD_COLUMNS: Array<{
  id: string;
  title: string;
  hint: string;
  statuses: SuborderStatus[];
}> = [
  {
    id: "new_order",
    title: "New",
    hint: "Review and start preparing",
    statuses: ["new_order"],
  },
  {
    id: "seller_processing",
    title: "Preparing",
    hint: "Pack the buyer's item",
    statuses: ["seller_processing"],
  },
  {
    id: "ready_for_hub",
    title: "Ready for hub",
    hint: "Parcel is ready to move",
    statuses: ["ready_for_hub"],
  },
  {
    id: "on_the_way_to_hub",
    title: "On the way",
    hint: "Dropped off or sent for pickup",
    statuses: ["on_the_way_to_hub"],
  },
  {
    id: "received_at_hub",
    title: "Hub check",
    hint: "Received and being verified",
    statuses: ["received_at_hub", "verified"],
  },
  {
    id: "packed",
    title: "Packed",
    hint: "Done for seller",
    statuses: ["packed"],
  },
  {
    id: "attention",
    title: "Needs attention",
    hint: "Issue or cancellation",
    statuses: ["issue_found", "cancelled"],
  },
];

// Seller-driven transitions — mirrors ALLOWED_SELLER_TRANSITIONS in the orders
// service (app/orders/fulfillment.py). First entry is the happy-path advance;
// any extra entry (e.g. `issue_found`) is a secondary action.
export const SELLER_ADVANCE: Record<string, SuborderStatus[]> = {
  new_order: ["seller_processing"],
  seller_processing: ["ready_for_hub"],
  ready_for_hub: ["on_the_way_to_hub"],
  on_the_way_to_hub: ["received_at_hub"],
  received_at_hub: ["verified"],
  verified: ["packed", "issue_found"],
};

const FALLBACK_LABEL = { en: "Order", icon: "package" } as const;

/** Safe lookups — an unrecognised status falls back instead of crashing. */
export function inboxLabel(status: string): { en: string; icon: string } {
  return INBOX_LABEL[status] ?? FALLBACK_LABEL;
}
export function inboxTone(status: string): string {
  return INBOX_TONE[status] ?? "neutral";
}

export const INBOX_DATE_RANGES = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

export function formatInboxTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function inDateRange(o: { time: string }, range: string) {
  if (range === "all") return true;
  const placedAt = new Date(o.time);
  if (!Number.isNaN(placedAt.getTime())) {
    const now = new Date();
    const ageMs = now.getTime() - placedAt.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (range === "today") return placedAt.toDateString() === now.toDateString();
    if (range === "7d") return ageMs >= 0 && ageMs <= 7 * oneDay;
    if (range === "30d") return ageMs >= 0 && ageMs <= 30 * oneDay;
  }

  // Legacy mock strings: "2 min ago", "1 hr ago", "yesterday", "2 days ago".
  const t = o.time.toLowerCase();
  const isToday = t.includes("min") || t.includes("hr");
  const isThisWeek = isToday || t.includes("yesterday") || /^[1-6] days?/.test(t);
  if (range === "today") return isToday;
  if (range === "7d") return isThisWeek;
  return true; // 30d catches everything in mock
}
