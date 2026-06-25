"use client";

import type { Product } from "@/types/catalog";

export type RecentActivityItem =
  | {
      kind: "product";
      label: string;
      href: string;
      at: number;
    }
  | {
      kind: "search";
      label: string;
      href: string;
      at: number;
    };

const STORAGE_KEY = "bz_recent_activity";
const LIMIT = 8;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): RecentActivityItem[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentActivityItem =>
        item &&
        (item.kind === "product" || item.kind === "search") &&
        typeof item.label === "string" &&
        typeof item.href === "string" &&
        typeof item.at === "number",
    );
  } catch {
    return [];
  }
}

function writeRaw(items: RecentActivityItem[]) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, LIMIT)));
    window.dispatchEvent(new Event("bz:recent-activity"));
  } catch {
    // Storage can fail in private mode; recents are optional.
  }
}

function upsert(item: RecentActivityItem) {
  const next = [item, ...readRaw().filter((existing) => existing.href !== item.href)];
  writeRaw(next);
}

export function recordRecentSearch(query: string) {
  const label = query.trim();
  if (!label) return;
  upsert({
    kind: "search",
    label,
    href: `/search?${new URLSearchParams({ q: label }).toString()}`,
    at: Date.now(),
  });
}

export function recordRecentProduct(product: Pick<Product, "id" | "name">) {
  const label = product.name.trim();
  if (!product.id || !label) return;
  upsert({
    kind: "product",
    label,
    href: `/product/${encodeURIComponent(product.id)}`,
    at: Date.now(),
  });
}
