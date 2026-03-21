import { test, expect } from "@playwright/test";

test.describe("Forgot Password", () => {
  test("sends reset link and shows success message", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('[name="email"]', "alice@test.com");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("shows validation error for empty email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Invalid email address")).toBeVisible();
  });

  test("has link back to sign in", async ({ page }) => {
    await page.goto("/forgot-password");
    const link = page.getByText("Back to sign in");
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL("/login");
  });
});
