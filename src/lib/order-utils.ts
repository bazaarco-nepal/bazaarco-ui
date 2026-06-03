export const CANCELLABLE_ORDER_STATUSES = ["placed", "applied", "confirmed", "packed"] as const;

export function canCancelOrder(order: { canCancel?: boolean; status: string }): boolean {
  if (typeof order.canCancel === "boolean") return order.canCancel;
  return (CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(order.status);
}
