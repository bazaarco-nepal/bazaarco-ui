import { test, expect, type Page } from "@playwright/test";

// Link / redirect crawl (CLAUDE.md §3.4). Loads each top-level public route,
// collects every internal <a href>, visits them, and asserts none return 4xx/5xx
// or land on an error boundary. This targets the "dead link / wrong redirect"
// class of UI bugs.
//
// REQUIRES a running UI + Core API (see playwright.config.ts). Excluded from the
// default `npm run test` (Vitest); run with `npm run test:e2e`.

// Public, no-auth-required entry points.
const TOP_LEVEL_ROUTES = ["/", "/home", "/browse", "/help", "/privacy", "/terms", "/about"];

function isInternal(href: string): boolean {
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  // same-origin only
  return href.startsWith("/") || href.includes("localhost:3000");
}

async function collectInternalLinks(page: Page): Promise<string[]> {
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") ?? ""));
  const internal = hrefs
    .filter(isInternal)
    .map((h) => (h.startsWith("http") ? new URL(h).pathname + new URL(h).search : h));
  return Array.from(new Set(internal));
}

test.describe("link & redirect crawl", () => {
  for (const route of TOP_LEVEL_ROUTES) {
    test(`route ${route} loads and its internal links resolve`, async ({ page, baseURL }) => {
      const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(resp, `no response for ${route}`).not.toBeNull();
      expect(resp!.status(), `${route} returned ${resp!.status()}`).toBeLessThan(400);

      const links = await collectInternalLinks(page);
      for (const link of links) {
        const target = new URL(link, baseURL ?? "http://localhost:3000").toString();
        const linkResp = await page.request.get(target);
        expect(
          linkResp.status(),
          `link ${link} (from ${route}) returned ${linkResp.status()}`,
        ).toBeLessThan(400);
      }

      // No client-side error boundary on the page itself.
      const body = (await page.textContent("body")) ?? "";
      expect(body).not.toMatch(/Application error|something went wrong|500 — Internal/i);
    });
  }
});
