// Seller sub-order lifecycle — mirrors the orders service `SuborderStatus` enum
// (bazaarco-orders-payments/app/orders/enums.py). The /seller/inbox endpoint
// returns these per sub-order. Keep in sync with the API.
export const SUBORDER_STATUSES = [
  "awaiting_payment",
  "new_order",
  "seller_processing",
  "ready_for_hub",
  "on_the_way_to_hub",
  "received_at_hub",
  "verified",
  "issue_found",
  "packed",
  "cancelled",
] as const;

export type SuborderStatus = (typeof SUBORDER_STATUSES)[number];

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
