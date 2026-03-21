import { test, expect } from "@playwright/test";
import { loginAs, uniqueEmail } from "./helpers";

test.describe("Authentication", () => {
  test("sign up → redirected to dashboard", async ({ page }) => {
    const email = uniqueEmail();

    await page.goto("/signup");
    await page.fill('[name="fullName"]', "E2E User");
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("login → dashboard → logout → login", async ({ page }) => {
    await loginAs(page, "alice@test.com", "password123");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.goto("/profile");
    await page.click("text=Sign Out");
    await page.waitForURL("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "alice@test.com");
    await page.fill('[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible();
  });

  test("login with empty fields shows validation errors", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("signup with short password shows validation error", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('[name="email"]', uniqueEmail());
    await page.fill('[name="password"]', "short");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });
});
