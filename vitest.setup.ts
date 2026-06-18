import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom here doesn't expose a working localStorage (Node warns "localStorage is
// not available"), so back it with an in-memory Storage the draft/component
// tests can read and write.
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => void store.delete(key),
    setItem: (key, value) => void store.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", { value: memoryStorage, configurable: true });
}

// Tear down the DOM between tests so component trees don't leak.
afterEach(() => {
  cleanup();
});
