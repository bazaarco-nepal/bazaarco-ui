"use client";

import { type SuborderStatus } from "@/shared/lib/order-utils";

export type SellerInboxOrderItem = {
  id: string;
  buyer: string;
  buyerAvatarUrl?: string | null;
  city: string;
  item: string;
  qty: number;
  price: number;
  pay: string;
  status: SuborderStatus;
  time: string;
  phone: string;
  icon: string;
  canCancel: boolean;
  // Multi-seller order: this seller accepted, but the order waits in "new_order"
  // until the remaining sellers confirm their parcels too.
  awaitingOtherSellers?: boolean;
};
