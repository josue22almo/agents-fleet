import { test, expect } from "@playwright/test";
import { loginAsAlice, switchToOrg } from "./helpers";

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

    await expect(page.locator("main").getByText("Total Runs").first()).toBeVisible();
    await expect(page.locator("main").getByText("Success Rate").first()).toBeVisible();
    await expect(page.locator("main").getByText("Avg Duration").first()).toBeVisible();
    await expect(page.locator("main").getByText("Total Cost").first()).toBeVisible();
  });

  test("shows runs table with status badges", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    // Click the "Runs" tab to see the runs table
    await page.getByRole("button", { name: "Runs" }).click();

    await expect(page.getByText("Recent Runs")).toBeVisible({ timeout: 10000 });
    // Verify at least one run row with a status is visible
    await expect(
      page
        .locator("main")
        .getByText("Completed")
        .or(page.locator("main").getByText("Failed"))
        .or(page.locator("main").getByText("Running"))
        .first(),
    ).toBeVisible();
  });

  test("switches org and shows different agents", async ({ page }) => {
    await page.goto("/agents");

    // Default org shows Alice's Claude
    await expect(page.locator("main").getByText("Alice's Claude")).toBeVisible();

    // Switch to Acme Corp
    await switchToOrg(page, "Acme Corp");

    // Wait for agents list to refresh
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

  test("shows charts section", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    await expect(page.getByText("Run Duration Distribution")).toBeVisible({ timeout: 10000 });
  });

  test("shows usage stats section", async ({ page }) => {
    await switchToOrg(page, "Acme Corp");
    await page.goto("/agents");

    const firstAgent = page.locator("main a[href*='/agents/']").first();
    await firstAgent.click();

    await expect(page.getByText("Total Runs").first()).toBeVisible();
    await expect(
      page.getByText(/usage this month|current period|usage/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("Tools tab shows tool usage", async ({ page }) => {
    await switchToOrg(page, "Acme Corp");
    await page.goto("/agents");

    const firstAgent = page.locator("main a[href*='/agents/']").first();
    await firstAgent.click();

    await page.getByRole("button", { name: "Tools" }).click();

    await expect(
      page.getByText(/Read|Write|Edit|Bash|Grep|Glob|No tool calls/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
