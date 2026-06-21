"use client";

import { createContext } from "react";

/* Which surface a button is rendering on. The buyer pack opts into the
   class-based button-system (button.css, scoped to [data-pack="buyer"]); the
   seller console keeps the legacy inline rendering untouched. Default "seller"
   so any button outside an explicit buyer pack stays on the safe legacy path. */
export const BzPack = createContext<"buyer" | "seller">("seller");
