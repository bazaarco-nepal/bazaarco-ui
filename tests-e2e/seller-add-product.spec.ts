import { test, expect, type Page } from "@playwright/test";

// Seller "Add Product" guided-workflow walkthrough.
//
// Verifies the frontend workflow layer added on top of the existing form:
// the section navigator with progress, the sticky action bar, the validation
// summary on an empty submit, the local-draft restore banner, and the Review
// step — without ever submitting a real product (no backend writes).
//
// REQUIRES a running UI + Core API (see playwright.config.ts) AND a VERIFIED
// seller account. Provide its credentials via env so the suite can sign in:
//
//   E2E_SELLER_EMAIL=seller@example.com \
//   E2E_SELLER_PASSWORD='…' \
//   npm run test:e2e -- seller-add-product
//
// Without those vars the suite skips (so it never fails an unconfigured CI).

const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL;
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD;

const SECTION_LABELS = ["Media", "Basic info", "Variants & pricing", "Bargaining", "Review"];

async function signInAsSeller(page: Page) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });

  await page.getByRole("textbox", { name: /email/i }).first().fill(SELLER_EMAIL!);
  // PasswordInput renders a real <input type="password"> — target it directly.
  await page.locator('input[type="password"]').first().fill(SELLER_PASSWORD!);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // A successful seller sign-in resolves to the seller dashboard.
  await page.waitForURL(/\/seller(\/|$)/, { timeout: 15_000 });
}

test.describe("seller add-product guided workflow", () => {
  test.skip(
    !SELLER_EMAIL || !SELLER_PASSWORD,
    "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD to run the seller workflow e2e.",
  );

  test.beforeEach(async ({ page }) => {
    await signInAsSeller(page);
    await page.goto("/seller/products/add", { waitUntil: "domcontentloaded" });
    // The page should land on the form, not bounce to onboarding (which would
    // mean the account isn't a verified seller).
    await expect(
      page.getByRole("heading", { name: /add a product|add product/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("renders the section navigator, applies the Fluent skin, and lists every section", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Form sections" });
    await expect(nav).toBeVisible();
    for (const label of SECTION_LABELS) {
      await expect(nav.getByRole("button", { name: new RegExp(label, "i") })).toBeVisible();
    }

    // The whole panel opts into the Fluent skin.
    await expect(page.locator('[data-skin="fluent"]').first()).toBeVisible();

    // Sticky action bar with the primary submit + step controls.
    const actionbar = page.getByRole("toolbar", { name: "Form actions" });
    await expect(actionbar).toBeVisible();
    await expect(actionbar.getByRole("button", { name: /publish/i })).toBeVisible();
    await expect(actionbar.getByRole("button", { name: /next/i })).toBeVisible();
  });

  test("shows a grouped validation summary when submitting an empty form", async ({ page }) => {
    const actionbar = page.getByRole("toolbar", { name: "Form actions" });
    await actionbar.getByRole("button", { name: /^publish$/i }).click();

    const summary = page.getByText(/fix these before publishing/i);
    await expect(summary).toBeVisible();

    // A summary item is a button that jumps to its section.
    const mediaIssue = page.getByRole("button", { name: /media:/i });
    await expect(mediaIssue).toBeVisible();
    await mediaIssue.click();
    await expect(page.locator("#sec-media")).toBeInViewport({ timeout: 5_000 });
  });

  test("section navigator jumps to a section and the Review step is present", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Form sections" });
    await nav.getByRole("button", { name: /review/i }).click();
    await expect(page.getByRole("heading", { name: /review & (publish|save)/i })).toBeVisible();
    await expect(page.locator("#sec-review")).toBeInViewport({ timeout: 5_000 });
  });

  test("offers to restore a local draft after a reload", async ({ page }) => {
    // Type something so the debounced autosave persists a draft, then reload.
    const titleField = page.getByRole("textbox").first();
    await titleField.click();
    await titleField.fill("E2E draft watch — not submitted");
    await page.waitForTimeout(900); // let the 600ms debounce flush

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/unsaved local draft/i)).toBeVisible({ timeout: 10_000 });

    // Clean up so the draft doesn't leak into other runs.
    await page.getByRole("button", { name: /^discard$/i }).click();
  });
});
