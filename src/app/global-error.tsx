"use client";

// Level 2 last-resort net: catches errors thrown by the root layout / providers
// themselves (which (public)/error.tsx sits below and cannot catch). It REPLACES
// the root layout, so it must supply its own <html>/<body>, styles, and the
// buyer pack scope (data-pack="buyer") that <Button> styling depends on.
// next/font variable classes are lost here → the display font falls back to the
// system stack; acceptable for this rare fallback. Keep it dependency-light so
// it can't itself throw.
import "@/styles/globals.css";

import { useEffect } from "react";

import { BuyerPack, MaintenanceMessage } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error] root render failure", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <BuyerPack>
          <div style={{ minHeight: "100dvh", background: "var(--page)" }}>
            <MaintenanceMessage variant="page" onRefresh={reset} />
          </div>
        </BuyerPack>
      </body>
    </html>
  );
}
