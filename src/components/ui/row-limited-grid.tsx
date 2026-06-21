"use client";

import React, { useRef } from "react";

import { useVisibleByRows } from "@/hooks/use-visible-by-rows";

type RowLimitedGridProps<T> = {
  items: T[];
  maxRows: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
};

/**
 * Renders an auto-fill grid but caps it to `maxRows` of cards regardless of how
 * many columns the current width yields. The full `items` array is passed in —
 * we just don't render the overflow (it stays reachable via the section's
 * see-all link). The cut always lands on a clean row boundary.
 */
export function RowLimitedGrid<T>({
  items,
  maxRows,
  renderItem,
  className,
}: RowLimitedGridProps<T>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const visibleCount = useVisibleByRows(gridRef, maxRows);

  return (
    <div ref={gridRef} className={className}>
      {items.slice(0, visibleCount).map(renderItem)}
    </div>
  );
}
