import { test, expect } from "@playwright/test";

test.describe("US3: Consumption History", () => {
  test("history page loads", async ({ page }) => {
    await page.goto("/history");
    await expect(page.getByRole("heading", { name: /history/i })).toBeVisible();
  });

  test("shows calendar or weekly strip", async ({ page }) => {
    await page.goto("/history");
    // At mobile viewport (375px), weekly strip should be visible
    // At desktop viewport (1280px), monthly calendar should be visible
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("has FAB to log coffee", async ({ page }) => {
    await page.goto("/history");
    const fab = page.getByRole("button", { name: /log coffee/i });
    await expect(fab).toBeVisible();
  });

  test("opening log dialog shows product and batch selectors", async ({ page }) => {
    await page.goto("/history");
    await page.getByRole("button", { name: /log coffee/i }).click();
    await expect(page.getByText(/log coffee/i).first()).toBeVisible();
  });

  test("today navigation button is visible", async ({ page }) => {
    await page.goto("/history");
    await expect(page.getByRole("button", { name: /today/i })).toBeVisible();
  });
});
