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
