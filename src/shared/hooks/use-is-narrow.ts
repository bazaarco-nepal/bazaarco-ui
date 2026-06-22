"use client";

import { useEffect, useState } from "react";

// Tracks whether the viewport is at/below a breakpoint. Generic — used by the
// buyer home feed, the seller chat split-pane and the storefront column layout.
export function useIsNarrow(bp = 720) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [bp]);
  return isMobile;
}
