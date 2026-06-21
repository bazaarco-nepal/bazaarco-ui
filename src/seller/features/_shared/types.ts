"use client";

import { type OrderStatus } from "@/shared/lib/order-utils";

export type SellerInboxOrderItem = {
  id: string;
  buyer: string;
  buyerAvatarUrl?: string | null;
  city: string;
  item: string;
  qty: number;
  price: number;
  pay: string;
  status: OrderStatus;
  time: string;
  phone: string;
  icon: string;
  tint: string;
  canCancel: boolean;
  // Multi-seller order: this seller accepted, but the order waits in "placed"
  // until the remaining sellers confirm their parcels too.
  awaitingOtherSellers?: boolean;
};
