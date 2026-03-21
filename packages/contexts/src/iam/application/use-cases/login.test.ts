import { describe, it, expect } from "vitest";
import { createTestDeps } from "./_test-helpers";
import { Login } from "./login";

describe("Login", () => {
  it("returns auth tokens", async () => {
    const deps = createTestDeps();
    const login = new Login(deps.authService);

    const tokens = await login.execute({
      email: "test@example.com",
      password: "password123",
    });

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });
});
