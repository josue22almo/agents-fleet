import { test, expect } from "@playwright/test";
import {
  loginAsAlice,
  switchToOrg,
  goToAgentsList,
  navigateToAgentDetail,
  navigateBackToAgentsList,
  expectAgentVisible,
} from "./helpers";

const ALICE_AGENT = "Alice's Claude";

test.describe("Agent Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("shows personal agent on default org", async ({ page }) => {
    await goToAgentsList(page);
    await expectAgentVisible(page, ALICE_AGENT);
  });

  test("shows stats cards on agent detail page", async ({ page }) => {
    await goToAgentsList(page);
    await navigateToAgentDetail(page, ALICE_AGENT);

    await expect(page.locator("main").getByText("Total Runs").first()).toBeVisible();
    await expect(page.locator("main").getByText("Success Rate").first()).toBeVisible();
    await expect(page.locator("main").getByText("Avg Duration").first()).toBeVisible();
    await expect(page.locator("main").getByText("Total Cost").first()).toBeVisible();
  });

  test("shows runs table with status badges", async ({ page }) => {
    await goToAgentsList(page);
    await navigateToAgentDetail(page, ALICE_AGENT);

    await page.getByRole("button", { name: "Runs" }).click();

    await expect(page.getByText("Recent Runs")).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator("main").getByText("Completed")
        .or(page.locator("main").getByText("Failed"))
        .or(page.locator("main").getByText("Running"))
        .first(),
    ).toBeVisible();
  });

  test("switches org and shows different agents", async ({ page }) => {
    await goToAgentsList(page);
    await expectAgentVisible(page, ALICE_AGENT);

    await switchToOrg(page, "Acme Corp");

    await expectAgentVisible(page, "Claude Code — Production");
    await expectAgentVisible(page, "Manus Research");
  });

  test("displays agent type and status badges", async ({ page }) => {
    await goToAgentsList(page);
    await navigateToAgentDetail(page, ALICE_AGENT);

    await expect(page.getByText("Claude").first()).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("navigates back to agents list via breadcrumb", async ({ page }) => {
    await goToAgentsList(page);
    await navigateToAgentDetail(page, ALICE_AGENT);
    await navigateBackToAgentsList(page);
  });

  test("shows charts section", async ({ page }) => {
    await goToAgentsList(page);
    await navigateToAgentDetail(page, ALICE_AGENT);

    await expect(page.getByText("Run Duration Distribution")).toBeVisible({ timeout: 10000 });
  });

  test("shows usage stats section", async ({ page }) => {
    await switchToOrg(page, "Acme Corp");
    await goToAgentsList(page);
    await navigateToAgentDetail(page, "Claude Code — Production");

    await expect(page.getByText("Total Runs").first()).toBeVisible();
    await expect(
      page.getByText(/usage this month|current period|usage/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("Tools tab shows tool usage", async ({ page }) => {
    await switchToOrg(page, "Acme Corp");
    await goToAgentsList(page);
    await navigateToAgentDetail(page, "Claude Code — Production");

    await page.getByRole("button", { name: "Tools" }).click();

    await expect(
      page.getByText(/Read|Write|Edit|Bash|Grep|Glob|No tool calls/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
