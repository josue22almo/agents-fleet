import { test, expect } from "@playwright/test";
import { loginAsAlice } from "./helpers";

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("displays user profile info", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText("alice@test.com")).toBeVisible();
  });

  test("updates full name", async ({ page }) => {
    await page.goto("/profile");

    const nameInput = page.locator('[name="fullName"]');
    await nameInput.clear();
    await nameInput.fill("Alice Updated");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Profile updated successfully")).toBeVisible();
  });
});
