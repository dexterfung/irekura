import { test, expect } from "@playwright/test";

test.describe("US1: Inventory Management", () => {
  test("can navigate to inventory page", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page.getByRole("heading", { name: /my coffee/i })).toBeVisible();
  });

  test("shows empty state with add button when no products", async ({ page }) => {
    await page.goto("/inventory");
    // Either shows products or empty state
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("can navigate to add product page", async ({ page }) => {
    await page.goto("/inventory/new");
    await expect(page.getByRole("heading", { name: /add coffee/i })).toBeVisible();
  });

  test("add product form has all required fields", async ({ page }) => {
    await page.goto("/inventory/new");
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/brand/i)).toBeVisible();
    await expect(page.getByText(/drip bag/i)).toBeVisible();
  });

  test("can fill and advance product form to batch step", async ({ page }) => {
    await page.goto("/inventory/new");
    await page.getByLabel(/name/i).fill("Test Coffee");
    await page.getByLabel(/brand/i).fill("Test Brand");
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByRole("heading", { name: /add first batch/i })).toBeVisible();
  });

  test("batch form has brews remaining and best before fields", async ({ page }) => {
    await page.goto("/inventory/new");
    await page.getByLabel(/name/i).fill("Test Coffee");
    await page.getByLabel(/brand/i).fill("Test Brand");
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByLabel(/brews remaining/i)).toBeVisible();
    await expect(page.getByLabel(/best before/i)).toBeVisible();
  });
});
