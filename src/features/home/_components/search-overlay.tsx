"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";
import { useBz } from "@/components/common";

// Curated for Nepal e-commerce, 2026 — blends Daraz's top categories
// (electronics, beauty) with the fashion staples buyers search most.
const POPULAR_SEARCHES = [
  "Wireless earbuds",
  "Smart watch",
  "Kurti",
  "Saree",
  "Sneakers",
  "Power bank",
  "Face wash",
];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { query, setQuery, submitSearch, clearSearch } = useBz();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // setQuery is a synchronous store write, so submitSearch() reads the new value.
  const run = (term?: string) => {
    if (term != null) setQuery(term);
    onClose();
    submitSearch();
  };

  return (
    <div
      className="bz-show-mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* top bar — back + live search input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid var(--line-200)",
        }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="bz-hover-tint"
          style={{
            width: 40,
            height: 40,
            border: "none",
            borderRadius: "var(--r-md)",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="chevronLeft" size={22} color="var(--ink-700)" />
        </button>
        <div style={{ flex: 1, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
            }}
          >
            <Icon name="search" size={18} color="var(--ink-400)" />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder="Search for products, brands…"
            style={{
              width: "100%",
              height: 44,
              border: "1.5px solid var(--red)",
              borderRadius: "var(--r-full)",
              padding: "0 40px",
              fontSize: ".9375rem",
              fontFamily: "var(--font-sans)",
              background: "#fff",
              outline: "none",
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
              className="bz-hover-tint"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                width: 28,
                height: 28,
                border: "none",
                borderRadius: "var(--r-full)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="x" size={16} color="var(--ink-400)" />
            </button>
          )}
        </div>
      </div>

      {/* popular searches */}
      <div style={{ padding: "20px 16px", overflowY: "auto" }}>
        <div
          style={{
            fontSize: "1.0625rem",
            fontWeight: 800,
            color: "var(--blue-deep)",
            marginBottom: 14,
          }}
        >
          Popular Searches
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => run(term)}
              className="bz-hover-border"
              style={{
                border: "1px solid var(--line-200)",
                background: "#fff",
                color: "var(--ink-700)",
                fontWeight: 600,
                fontSize: ".875rem",
                padding: "9px 16px",
                borderRadius: "var(--r-full)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
