import { test, expect } from "@playwright/test";
import { loginAsAlice, fakeOrg } from "./helpers";

test.describe("Organizations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("lists orgs including personal org", async ({ page }) => {
    await page.goto("/organizations");

    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
    await expect(page.getByText("Personal")).toBeVisible();
  });

  test("creates a team org and it appears in the list", async ({ page }) => {
    const org = fakeOrg();

    await page.goto("/organizations/new");
    await page.fill('[name="name"]', org.name);
    await page.fill('[name="slug"]', org.slug);
    await page.click('button[type="submit"]');

    await page.waitForURL("/organizations");
    await expect(page.locator("main").getByText(org.name)).toBeVisible();
  });

  test("rejects duplicate slug with error", async ({ page }) => {
    await page.goto("/organizations/new");
    await page.fill('[name="name"]', "Duplicate Test");
    await page.fill('[name="slug"]', "acme-corp");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/already|taken|exists|error/i)).toBeVisible();
  });

  test("rejects invalid slug format", async ({ page }) => {
    await page.goto("/organizations/new");
    await page.fill('[name="name"]', "Bad Slug");
    await page.fill('[name="slug"]', "INVALID SLUG!");
    await page.click('button[type="submit"]');

    await expect(page.locator(".text-destructive").first()).toBeVisible();
  });
});
