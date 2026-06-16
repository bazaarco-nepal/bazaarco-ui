"use client";

import { type SellerInventoryItem } from "@/services/api/seller";
import { type SellerInboxOrderItem } from "./types";


export const sellerOrderRef = { current: null as SellerInboxOrderItem | null };

// Threads the inventory row a seller tapped "Edit" on through to the edit
// screen (the SPA router renders screens by id and can't carry props itself).
// Mirrors `sellerOrderRef`. Holds the inventory item for stock/variant prefill;
// the full product (description, category, specs) is fetched by id on the screen.
export const editProductRef = { current: null as SellerInventoryItem | null };

// Threads the inventory row a seller tapped "View" on through to the view screen.
export const viewProductRef = { current: null as SellerInventoryItem | null };
