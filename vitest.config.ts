import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest setup for the storefront UI (React 19 / Next 15).
// jsdom environment for component/hook tests; Playwright E2E lives under
// `tests-e2e/` and is run separately via `npm run test:e2e` (NOT here).
export default defineConfig({
  // Cast around the vite-version skew between @vitejs/plugin-react (root vite)
  // and vitest's bundled vite — the Plugin types are structurally identical.
  plugins: [react() as never],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests-e2e/**"],
  },
});
