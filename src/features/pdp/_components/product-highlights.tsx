"use client";

import { Icon } from "@/components/ui";

type ProductHighlightsProps = {
  highlights?: string[];
};

/**
 * Short selling-point bullets shown above the description. Backend-driven only —
 * renders nothing when the seller provided no highlights, so the section never
 * shows an empty box.
 */
export function ProductHighlights({ highlights }: ProductHighlightsProps) {
  const items = (highlights ?? []).filter((h) => h.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <ul
      style={{
        listStyle: "none",
        margin: "16px 0 0",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {items.map((text, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            fontSize: ".875rem",
            color: "var(--ink-700)",
            lineHeight: 1.5,
          }}
        >
          <span style={{ flex: "0 0 auto", marginTop: 2 }}>
            <Icon name="check" size={14} color="var(--success)" stroke={2.5} />
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
