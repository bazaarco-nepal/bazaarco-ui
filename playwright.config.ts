import { defineConfig, devices } from "@playwright/test";

// E2E / link-crawl config for the storefront UI.
//
// REQUIRES A RUNNING APP + Core API. This is NOT part of `npm run test`
// (that runs Vitest only). Run it explicitly:
//
//   1. Start Core API (bazaarco-api) on :3001 and seed it.
//   2. Start the UI:   npm run dev      (serves http://localhost:3000)
//   3. Install browser: npx playwright install --with-deps chromium
//   4. Run:            npm run test:e2e
//
// Override the base URL with E2E_BASE_URL if the UI runs elsewhere.
export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
