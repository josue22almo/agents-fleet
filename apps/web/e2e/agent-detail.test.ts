import { test, expect } from "@playwright/test";
import { loginAsAlice } from "./helpers";

test.describe("Agent Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("shows personal agent on default org", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.locator("main").getByText("Alice's Claude")).toBeVisible();
  });

  test("shows stats cards on agent detail page", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    await expect(page.getByText("Total Runs")).toBeVisible();
    await expect(page.getByText("Success Rate")).toBeVisible();
    await expect(page.getByText("Avg Duration")).toBeVisible();
    await expect(page.getByText("Total Cost")).toBeVisible();
  });

  test("shows runs table with status badges", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    await expect(page.getByText("Recent Runs")).toBeVisible();
    const statusBadges = page.locator("text=/Completed|Failed|Running/");
    await expect(statusBadges.first()).toBeVisible();
  });

  test("switches org and shows different agents", async ({ page }) => {
    await page.goto("/agents");

    // Default org shows Alice's Claude
    await expect(page.locator("main").getByText("Alice's Claude")).toBeVisible();

    // Switch to Acme Corp
    await page.locator("aside button").first().click();
    await page.getByRole("menuitem", { name: "Acme Corp" }).click();

    // Wait for agents list to refresh
    await page.goto("/agents");
    await expect(page.locator("main").getByText("Claude Code — Production")).toBeVisible();
    await expect(page.locator("main").getByText("Manus Research")).toBeVisible();
  });

  test("displays agent type and status badges", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    await expect(page.getByText("Claude").first()).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("navigates back to agents list via breadcrumb", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    const breadcrumbLink = page.locator("a").filter({ hasText: "Agents" }).first();
    await breadcrumbLink.click();

    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  });
});
