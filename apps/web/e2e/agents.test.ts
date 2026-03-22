import { test, expect } from "@playwright/test";
import { loginAsAlice, fakeAgent } from "./helpers";

test.describe("Agents", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("lists seeded agents on agents page", async ({ page }) => {
    await page.goto("/agents");

    await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
    await expect(page.locator("main").getByText("Alice's Claude")).toBeVisible();
  });

  test("shows agent status badges", async ({ page }) => {
    await page.goto("/agents");

    await expect(page.getByText("Active").first()).toBeVisible();
  });

  test("create new agent shows token and agent appears in list", async ({ page }) => {
    const agent = fakeAgent();

    await page.goto("/agents/new");
    await expect(page.getByRole("heading", { name: "Connect Agent" })).toBeVisible();

    await page.fill('[name="name"], #agent-name', agent.name);

    const typeSelect = page.locator('[name="type"], #agent-type');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption(agent.type);
    }

    await page.click('button[type="submit"], button:has-text("Connect Agent")');

    await expect(page.getByText("Connection Token")).toBeVisible();
    await expect(page.getByText(/af_/)).toBeVisible();
    await expect(page.getByText(/won't be shown again/i)).toBeVisible();

    await page.goto("/agents");
    await expect(page.locator("main").getByText(agent.name)).toBeVisible();
  });

  test("click agent navigates to detail page", async ({ page }) => {
    await page.goto("/agents");

    await page.locator("main").getByText("Alice's Claude").click();

    await expect(page.getByRole("heading", { name: "Alice's Claude" })).toBeVisible();
    await expect(page.getByText("Recent Runs")).toBeVisible();
  });

  test("agent settings allows renaming agent", async ({ page }) => {
    // Create a temp agent to rename
    const agent = fakeAgent();

    await page.goto("/agents/new");
    await page.fill('[name="name"], #agent-name', agent.name);

    const typeSelect = page.locator('[name="type"], #agent-type');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("custom");
    }

    await page.click('button[type="submit"], button:has-text("Connect Agent")');
    await expect(page.getByText("Connection Token")).toBeVisible();

    await page.goto("/agents");
    const agentCard = page.locator("main").locator(`text=${agent.name}`).locator("..").locator("..");
    const settingsButton = agentCard.getByText("Settings");
    await settingsButton.click();

    await expect(page.getByRole("heading", { name: "Agent Settings" })).toBeVisible();

    const nameInput = page.locator('[name="name"], #agent-name');
    await nameInput.clear();
    await nameInput.fill(agent.name + " Renamed");
    await page.click('button:has-text("Save Changes")');

    await expect(
      page.getByText(agent.name + " Renamed").or(page.getByText(/saved|updated|success/i)),
    ).toBeVisible();
  });

  test("agent settings shows danger zone with delete", async ({ page }) => {
    await page.goto("/agents");

    const agentCard = page.locator("main").locator("text=Alice's Claude").locator("..").locator("..");
    const settingsButton = agentCard.getByText("Settings");
    await settingsButton.click();

    await expect(page.getByText("Danger Zone")).toBeVisible();
    await expect(page.getByText("Delete Agent")).toBeVisible();
  });

  test("delete agent removes it from the list", async ({ page }) => {
    const agent = fakeAgent();

    await page.goto("/agents/new");
    await page.fill('[name="name"], #agent-name', agent.name);

    const typeSelect = page.locator('[name="type"], #agent-type');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("custom");
    }

    await page.click('button[type="submit"], button:has-text("Connect Agent")');
    await expect(page.getByText("Connection Token")).toBeVisible();

    await page.goto("/agents");
    await expect(page.locator("main").getByText(agent.name)).toBeVisible();

    const agentCard = page.locator("main").locator(`text=${agent.name}`).locator("..").locator("..");
    const settingsButton = agentCard.getByText("Settings");
    await settingsButton.click();

    await page.click('button:has-text("Delete Agent")');

    const confirmButton = page.getByRole("button", { name: /confirm|delete|yes/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    await page.waitForURL("/agents");
    await expect(page.locator("main").getByText(agent.name)).not.toBeVisible();
  });
});
