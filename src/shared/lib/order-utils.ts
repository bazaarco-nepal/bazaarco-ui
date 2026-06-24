export const ORDER_STATUSES = [
  "awaiting_payment",
  "payment_failed",
  "confirmed",
  "seller_processing",
  "waiting_for_hub",
  "partially_received_at_hub",
  "received_at_hub",
  "verified",
  "packed_together",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
  // Legacy statuses (for orders created before migration)
  "placed",
  "accepted",
  "packaging_started",
  "ready_for_pickup",
  "picked_up",
  "arrived_at_hub",
  "shipped",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CANCELLABLE_ORDER_STATUSES = [
  "confirmed",
  "seller_processing",
  "waiting_for_hub",
  // Legacy
  "placed",
  "accepted",
  "packaging_started",
  "ready_for_pickup",
] as const;

export function canCancelOrder(order: { canCancel?: boolean; status: string }): boolean {
  if (typeof order.canCancel === "boolean") return order.canCancel;
  return (CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(order.status);
}
