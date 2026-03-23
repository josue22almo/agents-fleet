import { test, expect } from "@playwright/test";
import { loginAsAlice, switchToOrg } from "./helpers";

test.describe("Enhanced Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("dashboard shows chart components", async ({ page }) => {
    await page.goto("/dashboard");

    // Switch to Acme Corp which has seeded agents with runs
    await switchToOrg(page, "Acme Corp");

    // Chart sections should be visible
    await expect(page.getByText("Run Duration Distribution")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Tokens by Agent")).toBeVisible();
    await expect(page.getByText("Error Breakdown")).toBeVisible();
  });

  test("dashboard shows comparison table", async ({ page }) => {
    await page.goto("/dashboard");
    await switchToOrg(page, "Acme Corp");

    await expect(page.getByText("Agent Comparison")).toBeVisible({ timeout: 10000 });
  });

  test("dashboard shows activity feed section", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("Activity Feed")).toBeVisible();
  });

  test("dashboard metrics cards are visible", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("Total Agents")).toBeVisible();
    await expect(page.getByText("Active Runs")).toBeVisible();
    await expect(page.getByText("Avg Response Time")).toBeVisible();
  });
});

test.describe("Agent Detail - Charts & Tools", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("agent detail shows charts section", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    // Charts section should render
    await expect(page.getByText("Run Duration Distribution")).toBeVisible({ timeout: 10000 });
  });

  test("agent detail Tools tab shows tool usage or empty state", async ({ page }) => {
    await page.goto("/agents");
    await page.locator("main").getByText("Alice's Claude").click();

    // Click the Tools tab
    await page.getByRole("button", { name: "Tools" }).click();

    // Should see either the table or the empty state
    await expect(
      page.getByText("No tool calls recorded yet")
        .or(page.getByText("Tool Name"))
    ).toBeVisible({ timeout: 10000 });
  });
});
