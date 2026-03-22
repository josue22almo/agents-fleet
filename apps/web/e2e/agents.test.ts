import { test, expect } from "@playwright/test";
import { loginAsAlice, createAgent, switchToOrg, goToAgentSettings } from "./helpers";

test.describe("Agents", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
    await page.goto("/agents");
    // Switch to Acme Corp org (has seeded agents)
    await switchToOrg(page, "Acme Corp");
    // Wait for agents list to refresh after org switch
    await expect(page.locator("main").getByText("Claude Code — Production")).toBeVisible();
  });

  test("lists seeded agents on agents page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
    await expect(page.getByText("Claude Code — Production")).toBeVisible();
    await expect(page.getByText("Manus Research")).toBeVisible();
    await expect(page.getByText("Custom Script")).toBeVisible();
  });

  test("shows agent status badges", async ({ page }) => {
    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("create new agent shows token and agent appears in list", async ({ page }) => {
    const agentName = await createAgent(page);

    // Token should be displayed after creation
    await expect(page.getByText("Connection Token")).toBeVisible();
    await expect(page.getByText(/af_/).first()).toBeVisible();
    await expect(page.getByText(/won't be shown again/i)).toBeVisible();

    // Navigate to agents list and verify the new agent appears
    await page.goto("/agents");
    await expect(page.getByText(agentName)).toBeVisible();
  });

  test("click agent navigates to detail page", async ({ page }) => {
    await page.locator("main").getByText("Claude Code — Production").click();

    // Should navigate to detail page
    await expect(page.getByRole("heading", { name: "Claude Code — Production" })).toBeVisible();
    await expect(page.getByText("Recent Runs")).toBeVisible();
  });

  test("agent settings allows renaming agent", async ({ page }) => {
    // Create a fresh agent to rename
    const agentName = await createAgent(page, undefined, "custom");

    // Go to agents list and find our agent
    await page.goto("/agents");
    await goToAgentSettings(page, agentName);

    await expect(page.getByRole("heading", { name: "Agent Settings" })).toBeVisible();

    // Rename the agent
    const nameInput = page.locator('[name="name"], #agent-name');
    await nameInput.clear();
    await nameInput.fill(agentName + " Renamed");
    await page.click('button:has-text("Save Changes")');

    // Verify update succeeded
    await expect(
      page.getByText(agentName + " Renamed").or(page.getByText(/saved|updated|success/i)),
    ).toBeVisible();
  });

  test("agent settings shows danger zone with delete", async ({ page }) => {
    await goToAgentSettings(page, "Custom Script");

    await expect(page.getByText("Danger Zone")).toBeVisible();
    await expect(page.getByText("Delete Agent").nth(1)).toBeVisible();
  });

  test("delete agent removes it from the list", async ({ page }) => {
    // First create a temp agent to delete
    const agentName = await createAgent(page, undefined, "custom");

    // Navigate to agents list and find our agent
    await page.goto("/agents");
    await expect(page.getByText(agentName)).toBeVisible();

    // Go to settings for this agent
    await goToAgentSettings(page, agentName);

    // Delete the agent
    await page.click('button:has-text("Delete Agent")');

    // Handle confirmation dialog if present
    const confirmButton = page.getByRole("button", { name: /confirm|delete|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Should redirect to agents list and agent should be gone
    await page.waitForURL("/agents");
    await expect(page.getByText(agentName)).not.toBeVisible();
  });
});
