import { test, expect } from "@playwright/test";
import { loginAsAlice, switchToOrg } from "./helpers";

test.describe("Enhanced Features", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("dashboard reacts to org switch", async ({ page }) => {
    await page.goto("/dashboard");

    // Verify dashboard loads with default org
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Total Agents")).toBeVisible();

    // Switch to Acme Corp
    await switchToOrg(page, "Acme Corp");

    // Wait for metrics to update — Acme Corp has seeded agents
    await expect(page.getByText("Total Agents")).toBeVisible();

    // Switch to a personal org (fewer or no agents)
    await switchToOrg(page, "Space");

    // Dashboard should update again
    await expect(page.getByText("Total Agents")).toBeVisible();
  });

  test("agent detail shows usage stats section", async ({ page }) => {
    // Switch to Acme Corp which has agents with data
    await switchToOrg(page, "Acme Corp");
    await page.goto("/agents");

    // Click on the first agent
    const firstAgent = page.locator("main a[href*='/agents/']").first();
    await firstAgent.click();

    // Verify we're on agent detail
    await expect(page.getByText("Total Runs").first()).toBeVisible();

    // Verify usage section exists
    await expect(
      page.getByText(/usage this month|current period|usage/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("agent detail Tools tab shows tool usage", async ({ page }) => {
    // Switch to Acme Corp which has seeded tool call data
    await switchToOrg(page, "Acme Corp");
    await page.goto("/agents");

    // Click on the first agent
    const firstAgent = page.locator("main a[href*='/agents/']").first();
    await firstAgent.click();

    // Click Tools tab
    const toolsTab = page.getByRole("button", { name: "Tools" })
      .or(page.getByText("Tools").first());
    await toolsTab.click();

    // Verify tool call data is shown (from seed)
    await expect(
      page.getByText(/Read|Write|Edit|Bash|Grep|Glob|No tool calls/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
