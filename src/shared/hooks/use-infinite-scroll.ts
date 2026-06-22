"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-loads more content when a sentinel element scrolls into view. Returns a
 * ref to attach to the sentinel (place it just after the list). `rootMargin`
 * pre-fetches before the user reaches the bottom so loading feels seamless.
 *
 * The hook only fires `onReach` while `enabled`; it disconnects otherwise and on
 * unmount. De-duping concurrent loads is the caller's job — pass an `onReach`
 * that no-ops while a fetch is in flight (the explore feed's `loadMore` already
 * guards on `isFetchingNextPage`).
 */
export function useInfiniteScroll(
  onReach: () => void,
  { enabled, rootMargin = "600px" }: { enabled: boolean; rootMargin?: string },
): React.RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReach();
      },
      { rootMargin },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, rootMargin, onReach]);

  return sentinelRef;
}
