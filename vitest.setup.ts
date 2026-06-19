import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom under Node 22+ exposes no Web Storage (Node's own `localStorage` needs
// `--localstorage-file`, and jsdom doesn't install one), so `window.localStorage`
// is undefined in tests. Provide a small in-memory Storage so components that read
// drafts/prefs work the same as in a real browser. Only installs when missing —
// never shadows a real implementation.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  if (!(globalThis as Record<string, unknown>)[name]) {
    const storage = new MemoryStorage();
    Object.defineProperty(globalThis, name, { value: storage, configurable: true });
    if (typeof window !== "undefined" && !window[name]) {
      Object.defineProperty(window, name, { value: storage, configurable: true });
    }
  }
}

// Tear down the DOM between tests so component trees don't leak.
afterEach(() => {
  cleanup();
});
