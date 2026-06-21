"use client";

import { useEffect } from "react";

import { MaintenanceMessage } from "@/components/ui";

/* Level 2 — critical feature failure. Catches errors thrown while rendering any
   buyer route (e.g. the catalog/cart/product query throwing on an outage). It
   lives INSIDE (public)/layout.tsx, so the header/nav/footer stay rendered and
   the maintenance message appears in the content region. reset() re-renders the
   segment and re-runs the failed queries — wired to the Refresh button. */

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public/error] critical render failure", error.digest ?? "", error);
  }, [error]);

  return <MaintenanceMessage variant="page" onRefresh={reset} />;
}
