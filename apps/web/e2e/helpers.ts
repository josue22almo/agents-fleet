import type { Page } from "@playwright/test";
import { faker } from "@faker-js/faker";

const API_URL = "http://localhost:4000";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

export async function loginAsAlice(page: Page) {
  await loginAs(page, "alice@test.com", "password123");
}

export async function logout(page: Page) {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.waitForURL("/login");
}

export async function getApiToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const { accessToken } = await res.json();
  return accessToken;
}

export function fakeUser() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    fullName: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName, provider: "e2e-test.com" }).toLowerCase(),
    password: "password123",
  };
}

export function fakeOrg() {
  const name = faker.company.name();
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    faker.string.alphanumeric(4).toLowerCase();
  return { name, slug };
}

export function fakeAgent() {
  const name = `${faker.hacker.adjective()} ${faker.hacker.noun()} Agent`;
  const type = faker.helpers.arrayElement(["claude", "manus", "custom"] as const);
  return { name, type };
}

/**
 * Creates a new agent via the UI form. Returns the agent's name.
 * Assumes the user is already logged in and on any page.
 */
export async function createAgent(
  page: Page,
  name?: string,
  type?: "claude" | "manus" | "custom",
): Promise<string> {
  const agent = fakeAgent();
  const agentName = name ?? agent.name;
  const agentType = type ?? agent.type;

  await page.goto("/agents/new");
  await page.fill('[name="name"], #agent-name', agentName);

  // Select agent type via shadcn Select (Radix)
  await page.getByText("Select type").or(page.getByText("claude")).click();
  await page.getByRole("option", { name: agentType }).click();

  await page.click('button[type="submit"], button:has-text("Connect Agent")');

  // Wait for token to be displayed (confirms creation succeeded)
  await page.locator("text=Connection Token").waitFor();

  return agentName;
}

/**
 * Switches to the given organization via the sidebar org switcher.
 */
export async function switchToOrg(page: Page, orgName: string) {
  await page.locator("aside button").first().click();
  await page.getByRole("menuitem", { name: orgName }).click();
}

/**
 * Navigates to the settings page for a specific agent from the agents list.
 * Assumes the agents list is currently visible.
 */
export async function goToAgentSettings(page: Page, agentName: string) {
  const agentCard = page.locator("main > div > div").filter({ hasText: agentName });
  await agentCard.getByRole("link", { name: "Settings" }).click();
}
