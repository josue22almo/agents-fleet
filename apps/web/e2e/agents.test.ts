import { test, expect } from "@playwright/test";
import { loginAsAlice, fakeAgent } from "./helpers";

test.describe("Agents", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("lists seeded agents on agents page", async ({ page }) => {
    await page.goto("/agents");

    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
    await expect(page.getByText("Claude Code — Production")).toBeVisible();
    await expect(page.getByText("Manus Research")).toBeVisible();
    await expect(page.getByText("Custom Script")).toBeVisible();
  });

  test("shows agent status badges", async ({ page }) => {
    await page.goto("/agents");

    await expect(page.getByText("Active").first()).toBeVisible();
    await expect(page.getByText("Inactive")).toBeVisible();
  });

  test("create new agent shows token and agent appears in list", async ({ page }) => {
    const agent = fakeAgent();

    await page.goto("/agents/new");
    await expect(page.getByRole("heading", { name: "Connect Agent" })).toBeVisible();

    await page.fill('[name="name"], #agent-name', agent.name);

    // Select agent type
    const typeSelect = page.locator('[name="type"], #agent-type');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(agent.type);
    }

    await page.click('button[type="submit"], button:has-text("Connect Agent")');

    // Token should be displayed after creation
    await expect(page.getByText("Connection Token")).toBeVisible();
    await expect(page.getByText(/af_/)).toBeVisible();
    await expect(page.getByText(/won't be shown again/i)).toBeVisible();

    // Navigate to agents list and verify the new agent appears
    await page.goto("/agents");
    await expect(page.getByText(agent.name)).toBeVisible();
  });

  test("click agent navigates to detail page", async ({ page }) => {
    await page.goto("/agents");

    await page.getByText("Claude Code — Production").click();

    // Should navigate to detail page
    await expect(page.getByRole("heading", { name: "Claude Code — Production" })).toBeVisible();
    await expect(page.getByText("Recent Runs")).toBeVisible();
  });

  test("agent settings allows renaming agent", async ({ page }) => {
    await page.goto("/agents");

    // Find and click Settings for an agent
    const agentCard = page.locator("text=Claude Code — Production").locator("..").locator("..");
    const settingsButton = agentCard.getByText("Settings");
    await settingsButton.click();

    await expect(page.getByRole("heading", { name: "Agent Settings" })).toBeVisible();

    // Rename the agent
    const nameInput = page.locator('[name="name"], #agent-name');
    await nameInput.clear();
    await nameInput.fill("Claude Code — Staging");
    await page.click('button:has-text("Save Changes")');

    // Verify update succeeded (look for success message or updated name)
    await expect(
      page.getByText("Claude Code — Staging").or(page.getByText(/saved|updated|success/i)),
    ).toBeVisible();

    // Rename back for idempotency
    const nameInputAgain = page.locator('[name="name"], #agent-name');
    await nameInputAgain.clear();
    await nameInputAgain.fill("Claude Code — Production");
    await page.click('button:has-text("Save Changes")');
  });

  test("agent settings shows danger zone with delete", async ({ page }) => {
    await page.goto("/agents");

    const agentCard = page.locator("text=Custom Script").locator("..").locator("..");
    const settingsButton = agentCard.getByText("Settings");
    await settingsButton.click();

    await expect(page.getByText("Danger Zone")).toBeVisible();
    await expect(page.getByText("Delete Agent")).toBeVisible();
  });

  test("delete agent removes it from the list", async ({ page }) => {
    // First create a temp agent to delete
    const agent = fakeAgent();

    await page.goto("/agents/new");
    await page.fill('[name="name"], #agent-name', agent.name);

    const typeSelect = page.locator('[name="type"], #agent-type');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("custom");
    }

    await page.click('button[type="submit"], button:has-text("Connect Agent")');
    await expect(page.getByText("Connection Token")).toBeVisible();

    // Navigate to agents list and find our agent
    await page.goto("/agents");
    await expect(page.getByText(agent.name)).toBeVisible();

    // Go to settings for this agent
    const agentCard = page.locator(`text=${agent.name}`).locator("..").locator("..");
    const settingsButton = agentCard.getByText("Settings");
    await settingsButton.click();

    // Delete the agent
    await page.click('button:has-text("Delete Agent")');

    // Handle confirmation dialog if present
    const confirmButton = page.getByRole("button", { name: /confirm|delete|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Should redirect to agents list and agent should be gone
    await page.waitForURL("/agents");
    await expect(page.getByText(agent.name)).not.toBeVisible();
  });
});
