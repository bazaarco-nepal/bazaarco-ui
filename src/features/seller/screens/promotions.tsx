"use client";

import React, { useEffect } from "react";
import { useBz } from "@/components/common";

/* ---------- 4.9 Promotions (removed) ---------- */
export function SellerPromotions() {
  const { nav } = useBz();
  useEffect(() => {
    nav("s-dashboard");
  }, [nav]);
  return null;
}
