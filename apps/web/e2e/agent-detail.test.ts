import { test, expect } from "@playwright/test";
import { loginAsAlice } from "./helpers";

test.describe("Agent Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("shows stats cards on agent detail page", async ({ page }) => {
    await page.goto("/agents");

    // Click on the first active agent (Claude Code)
    await page.getByText("Claude Code — Production").click();

    await expect(page.getByRole("heading", { name: "Claude Code — Production" })).toBeVisible();

    // Verify stats cards are present
    await expect(page.getByText("Total Runs")).toBeVisible();
    await expect(page.getByText("Success Rate")).toBeVisible();
    await expect(page.getByText("Avg Duration")).toBeVisible();
    await expect(page.getByText("Total Cost")).toBeVisible();
  });

  test("shows runs table with status badges", async ({ page }) => {
    await page.goto("/agents");
    await page.getByText("Claude Code — Production").click();

    await expect(page.getByText("Recent Runs")).toBeVisible();

    // Verify table headers
    await expect(page.getByText("Run ID").or(page.getByText("run id"))).toBeVisible();
    await expect(page.getByText("Status").first()).toBeVisible();
    await expect(page.getByText("Duration").first()).toBeVisible();

    // Verify at least one run row exists with a status badge
    const statusBadges = page.locator("text=/Completed|Failed|Running/");
    await expect(statusBadges.first()).toBeVisible();
  });

  test("shows settings link on agent detail", async ({ page }) => {
    await page.goto("/agents");
    await page.getByText("Claude Code — Production").click();

    const settingsLink = page.getByRole("link", { name: "Settings" }).or(
      page.getByRole("button", { name: "Settings" }),
    );
    await expect(settingsLink).toBeVisible();
  });

  test("displays agent type and status badges", async ({ page }) => {
    await page.goto("/agents");
    await page.getByText("Claude Code — Production").click();

    // Type badge
    await expect(page.getByText("Claude").first()).toBeVisible();
    // Status badge
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("navigates back to agents list via breadcrumb", async ({ page }) => {
    await page.goto("/agents");
    await page.getByText("Claude Code — Production").click();

    // Click breadcrumb link back to Agents
    const breadcrumbLink = page.locator("a").filter({ hasText: "Agents" }).first();
    await breadcrumbLink.click();

    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  });
});
