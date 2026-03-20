import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TestApi } from "../../test-api";

describe("AuthController (e2e)", () => {
  let api: TestApi;

  beforeAll(async () => {
    api = await TestApi.create();
  });

  afterAll(async () => {
    await api.close();
  });

  it("POST /auth/signup — creates a user", async () => {
    const res = await api.signup("test@example.com", "password123", "Test");
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("test@example.com");
    expect(res.body.fullName).toBe("Test");
  });

  it("POST /auth/signup — rejects invalid email", async () => {
    const res = await api.signup("invalid", "password123");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /auth/signup — rejects short password", async () => {
    const res = await api.signup("valid@example.com", "short");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /auth/login — returns tokens", async () => {
    await api.signup("login@example.com", "password123");
    const res = await api.login("login@example.com", "password123");
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("POST /auth/forgot-password — always succeeds", async () => {
    const res = await api.forgotPassword("anyone@example.com");
    expect(res.status).toBe(201);
    expect(res.body.message).toContain("reset link");
  });

  it("GET /auth/me — returns 401 without token", async () => {
    const res = await api.getProfile("");
    expect(res.status).toBe(401);
  });

  it("GET /auth/me — returns profile with valid token", async () => {
    const token = await api.signupAndLogin("me@example.com", "password123", "Me");
    const res = await api.getProfile(token);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@example.com");
  });

  it("PATCH /auth/me — updates profile", async () => {
    const token = await api.signupAndLogin("update@example.com", "password123", "Old");
    const res = await api.updateProfile(token, { fullName: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe("New Name");
  });
});
