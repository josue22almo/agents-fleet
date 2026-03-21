import { test, expect } from "@playwright/test";
import { loginAsAlice } from "./helpers";

test.describe("Organization Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("shows org settings with members list", async ({ page }) => {
    await page.goto("/organizations/acme-corp/settings");

    await expect(page.getByText("Acme Corp Settings")).toBeVisible();
    await expect(page.getByText("Members")).toBeVisible();
    await expect(page.getByText("alice@test.com")).toBeVisible();
  });

  test("shows invite form", async ({ page }) => {
    await page.goto("/organizations/acme-corp/settings");

    await expect(page.getByText("Invite Member")).toBeVisible();
    await expect(page.getByPlaceholder("email@example.com")).toBeVisible();
  });

  test("shows danger zone", async ({ page }) => {
    await page.goto("/organizations/acme-corp/settings");

    await expect(page.getByText("Danger Zone")).toBeVisible();
    await expect(page.getByText("Delete Organization")).toBeVisible();
  });
});
