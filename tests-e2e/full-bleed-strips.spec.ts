import { expect, test } from "@playwright/test";

const STRIPS = [
  ".bz-navbar",
  ".bz-navbar__desktop",
  ".bz-navbar__utility",
  ".bz-navbar__main",
  ".bz-navbar__cats",
  ".bz-navbar__mobile",
  ".bz-navbar__m-bar",
  ".bz-navbar__cats-strip",
  ".bz-band--watch",
  ".bz-band--bargain",
  "footer",
];

test.describe("full-bleed horizontal strips", () => {
  for (const width of [1280, 1440, 1680, 1920, 2560, 768, 390]) {
    test(`background wrappers reach viewport edges at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/home", { waitUntil: "domcontentloaded" });
      await page.locator(".bz-navbar").waitFor({ state: "visible" });

      const result = await page.evaluate((selectors) => {
        const viewportWidth = document.documentElement.clientWidth;
        const overflow =
          document.documentElement.scrollWidth > viewportWidth ||
          document.body.scrollWidth > viewportWidth;

        const failures = selectors.flatMap((selector) => {
          const element = document.querySelector(selector);
          if (!element) return [];

          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return [];

          const left = Math.round(rect.left);
          const right = Math.round(rect.right);
          const expectedRight = Math.round(viewportWidth);

          return left === 0 && Math.abs(right - expectedRight) <= 1
            ? []
            : [{ selector, left, right, viewportWidth: expectedRight }];
        });

        return { overflow, failures };
      }, STRIPS);

      expect(result.overflow).toBe(false);
      expect(result.failures).toEqual([]);
    });
  }
});
