"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/shared/hooks/use-auth";
import { useBazaarStore } from "@/store/bazaar-store";

/**
 * Probes the live session once for the whole app and seeds the auth state that
 * BOTH the buyer and seller environments depend on: the persisted role hint (so
 * a returning seller is held on a loader instead of flashing the buyer home),
 * the buyer phone, and the `authReady` flag. Lives in `shared/` because both
 * route groups mount below it; the buyer-only cart/saved/checkout context stays
 * in the buyer provider.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const meQuery = useCurrentUser(true);
  const setAuthReady = useBazaarStore((s) => s.setAuthReady);
  const hydrateRoleHint = useBazaarStore((s) => s.hydrateRoleHint);
  const hydrateBuyerPhone = useBazaarStore((s) => s.hydrateBuyerPhone);

  // Seed the persisted role hint as early as possible so a returning seller is
  // held on a loader (not the buyer homepage) while the /me probe is in flight.
  useEffect(() => {
    hydrateRoleHint();
    hydrateBuyerPhone();
  }, [hydrateRoleHint, hydrateBuyerPhone]);

  useEffect(() => {
    if (meQuery.isFetched) {
      setAuthReady(true);
    }
    // Probe failed — no live session. Drop a stale hint so we don't keep gating
    // a signed-out (e.g. expired) former seller behind a loader.
    if (meQuery.isError) {
      useBazaarStore.getState().setRoleHint(null);
    }
  }, [meQuery.isFetched, meQuery.isError, setAuthReady]);

  return <>{children}</>;
}
