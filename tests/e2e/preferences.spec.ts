import { test, expect } from "@playwright/test";

test.describe("US4: Preferences", () => {
  test("preferences page loads", async ({ page }) => {
    await page.goto("/preferences");
    await expect(page.getByRole("heading", { name: /preferences/i })).toBeVisible();
  });

  test("shows weekday and weekend tabs", async ({ page }) => {
    await page.goto("/preferences");
    await expect(page.getByRole("tab", { name: /weekday/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /weekend/i })).toBeVisible();
  });

  test("shows flavor sliders", async ({ page }) => {
    await page.goto("/preferences");
    await expect(page.getByText(/bitterness importance/i)).toBeVisible();
    await expect(page.getByText(/sourness importance/i)).toBeVisible();
    await expect(page.getByText(/richness importance/i)).toBeVisible();
  });

  test("shows save button", async ({ page }) => {
    await page.goto("/preferences");
    await expect(page.getByRole("button", { name: /save profile/i })).toBeVisible();
  });

  test("can switch between weekday and weekend tabs", async ({ page }) => {
    await page.goto("/preferences");
    await page.getByRole("tab", { name: /weekend/i }).click();
    await expect(page.getByRole("tab", { name: /weekend/i })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});
