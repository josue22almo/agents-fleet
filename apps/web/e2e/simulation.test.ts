import { test, expect } from "@playwright/test";
import { loginAsAlice } from "./helpers";

test.describe("MCP Simulation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test("runs simulation end-to-end and creates agent with session", async ({ page }) => {
    await page.goto("/agents");

    // Find the MCP Simulation intro card
    await expect(page.getByText("MCP Simulation")).toBeVisible();
    await expect(page.getByText("Run a live end-to-end simulation")).toBeVisible();

    // Click "Start Simulation"
    await page.getByRole("button", { name: "Start Simulation" }).click();

    // Wait for simulation to complete (up to 30s for all steps + delays)
    await expect(page.getByText("Simulation complete!")).toBeVisible({ timeout: 30000 });

    // Verify the new agent appears — the "View Agent" link should be present
    const viewAgentLink = page.getByRole("link", { name: "View Agent" });
    await expect(viewAgentLink).toBeVisible();

    // Click "View Agent" to navigate to the agent detail page
    await viewAgentLink.click();

    // Verify we're on the agent detail page with the simulation agent
    await expect(page.getByText("Simulation Agent")).toBeVisible({ timeout: 5000 });

    // Verify the Sessions tab is visible (default tab)
    await expect(page.getByRole("button", { name: "Sessions" })).toBeVisible();

    // Verify the session created by simulation is visible
    await expect(page.getByText("Demo: Code Review")).toBeVisible({ timeout: 5000 });
  });
});
