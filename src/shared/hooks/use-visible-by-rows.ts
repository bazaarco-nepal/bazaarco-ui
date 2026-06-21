"use client";

import { useCallback, useEffect, useState } from "react";

// Sensible default until the grid is measured — first paint (or a momentarily
// display:none grid) can report no columns, so we render this many until the
// observer corrects us on the next tick.
const FALLBACK_COLS = 6;

/**
 * Live column count of a responsive `auto-fill` grid, read from its computed
 * `grid-template-columns`. Re-measures on resize/zoom/scale via a ResizeObserver,
 * so More Space ↔ 125% updates it without a reload.
 */
export function useGridColumns(gridRef: React.RefObject<HTMLElement | null>): number {
  const [cols, setCols] = useState(FALLBACK_COLS);

  const measure = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const template = getComputedStyle(grid).gridTemplateColumns;
    const count = template.split(" ").filter(Boolean).length;
    // A hidden grid reports "none" (count 1) and first paint can report 0 —
    // keep the last good column count rather than collapsing to one column.
    if (count > 0 && template !== "none") setCols(count);
  }, [gridRef]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [gridRef, measure]);

  return cols;
}

/**
 * How many items fit within `maxRows` of the grid's current column count.
 * Built on {@link useGridColumns} so the measurement lives in one place.
 */
export function useVisibleByRows(
  gridRef: React.RefObject<HTMLElement | null>,
  maxRows: number,
): number {
  return useGridColumns(gridRef) * maxRows;
}
