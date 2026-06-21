"use client";

import { BzPack } from "@/shared/ui/pack";

/* Mark a subtree as buyer — sets the [data-pack="buyer"] CSS scope and the pack
   context. `display:contents` so the wrapper adds no box of its own. */
export function BuyerPack({ children }: { children: React.ReactNode }) {
  return (
    <div data-pack="buyer" style={{ display: "contents" }}>
      <BzPack.Provider value="buyer">{children}</BzPack.Provider>
    </div>
  );
}
