"use client";

import React, { useState, useEffect } from "react";

/* ---------- 4.7 Customer Chat ---------- */
// Tracks whether the viewport is at/below a breakpoint. Generic — used by the
// chat split-pane and the storefront's column layout.
function useIsNarrow(bp = 720) {
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

export { useIsNarrow };
