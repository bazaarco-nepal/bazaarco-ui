export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "packaging_started",
  "ready_for_pickup",
  "picked_up",
  "arrived_at_hub",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CANCELLABLE_ORDER_STATUSES = [
  "placed",
  "accepted",
  "packaging_started",
  "ready_for_pickup",
] as const;

export function canCancelOrder(order: { canCancel?: boolean; status: string }): boolean {
  if (typeof order.canCancel === "boolean") return order.canCancel;
  return (CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(order.status);
}
