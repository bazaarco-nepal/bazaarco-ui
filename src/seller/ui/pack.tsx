"use client";

import { BzPack } from "@/shared/ui/pack";

/* Mark a subtree as the seller surface (e.g. a seller screen mounted inside the
   buyer shell) so its buttons keep the legacy Fluent-console look. */
export function SellerPack({ children }: { children: React.ReactNode }) {
  return <BzPack.Provider value="seller">{children}</BzPack.Provider>;
}
