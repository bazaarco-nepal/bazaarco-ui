"use client";

import { useEffect, useState } from "react";

export interface SectionTab {
  id: string;
  label: string;
}

interface SectionTabsProps {
  sections: SectionTab[];
  /** Sticky offset (px) below the fixed navbar. */
  offset?: number;
}

/**
 * Sticky in-page nav for the PDP lower sections. Clicking scrolls to the
 * section; an IntersectionObserver keeps the active pill in sync while the user
 * scrolls. Horizontally scrollable on narrow screens.
 */
export function SectionTabs({ sections, offset = 64 }: SectionTabsProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Bias the active band to just under the sticky bar.
      { rootMargin: `-${offset + 8}px 0px -55% 0px`, threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections, offset]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <div
      style={{
        position: "sticky",
        top: offset,
        zIndex: 20,
        background: "var(--page, #fff)",
        borderBottom: "1px solid var(--line-200)",
        display: "flex",
        gap: 8,
        padding: "10px 0",
        marginTop: 40,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {sections.map((s) => {
        const on = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={on}
            onClick={() => jump(s.id)}
            className="bz-hover-border"
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: "var(--r-md)",
              border: `1.5px solid ${on ? "var(--blue)" : "var(--line-200)"}`,
              background: on ? "var(--tint-blue-50)" : "#fff",
              color: on ? "var(--blue)" : "var(--ink-500)",
              fontWeight: 700,
              fontSize: ".875rem",
              cursor: "pointer",
              transition: "all var(--dur-standard, .15s) var(--ease, ease)",
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
