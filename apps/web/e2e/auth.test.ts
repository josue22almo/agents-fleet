import { test, expect } from "@playwright/test";
import { loginAs, fakeUser } from "./helpers";

test.describe("Authentication", () => {
  test("sign up → redirected to dashboard", async ({ page }) => {
    const user = fakeUser();

    await page.goto("/signup");
    await page.fill('[name="fullName"]', user.fullName);
    await page.fill('[name="email"]', user.email);
    await page.fill('[name="password"]', user.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("login → dashboard → logout → login", async ({ page }) => {
    await loginAs(page, "alice@test.com", "password123");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.goto("/profile");
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
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
    const user = fakeUser();

    await page.goto("/signup");
    await page.fill('[name="email"]', user.email);
    await page.fill('[name="password"]', "short");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
  });

  test("change password flow", async ({ page }) => {
    await loginAs(page, "alice@test.com", "password123");
    await page.goto("/profile");

    await page.fill('[name="currentPassword"]', "password123");
    await page.fill('[name="newPassword"]', "newpassword456");
    await page.getByRole("button", { name: "Change Password" }).click();

    await expect(
      page.getByText(/password changed|password updated|success/i),
    ).toBeVisible({ timeout: 5000 });

    // Logout and login with new password
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL("/login");
    await loginAs(page, "alice@test.com", "newpassword456");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Reset password back for other tests
    await page.goto("/profile");
    await page.fill('[name="currentPassword"]', "newpassword456");
    await page.fill('[name="newPassword"]', "password123");
    await page.getByRole("button", { name: "Change Password" }).click();
    await expect(
      page.getByText(/password changed|password updated|success/i),
    ).toBeVisible({ timeout: 5000 });
  });
});
