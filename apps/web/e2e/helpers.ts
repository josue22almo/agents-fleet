import type { Page } from "@playwright/test";

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
  await page.click("text=Sign Out");
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

let signupCounter = 0;

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${++signupCounter}@test.com`;
}
