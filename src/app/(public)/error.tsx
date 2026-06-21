"use client";

import { useEffect } from "react";

import { MaintenanceMessage } from "@/components/ui";

/* Level 2 — critical feature failure. Catches errors thrown while rendering any
   buyer route (e.g. the catalog/cart/product query throwing on an outage). It
   lives INSIDE (public)/layout.tsx, so the header/nav/footer stay rendered and
   the maintenance message appears in the content region. The Refresh button
   sends the shopper back to the homepage for a clean, fresh load. */

export default function PublicError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[public/error] critical render failure", error.digest ?? "", error);
  }, [error]);

  return <MaintenanceMessage variant="page" />;
}
