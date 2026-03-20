import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TestApi } from "../../test-api";

describe("OrganizationsController (e2e)", () => {
  let api: TestApi;
  let accessToken: string;

  beforeAll(async () => {
    api = await TestApi.create();
    accessToken = await api.signupAndLogin("org-user@example.com", "password123", "Org User");
  });

  afterAll(async () => {
    await api.close();
  });

  it("GET /organizations — lists user orgs (includes personal)", async () => {
    const res = await api.listOrganizations(accessToken);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /organizations — creates a team org", async () => {
    const res = await api.createOrganization(accessToken, "Acme Inc", "acme");
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Acme Inc");
    expect(res.body.slug).toBe("acme");
    expect(res.body.type).toBe("team");
  });

  it("POST /organizations — rejects duplicate slug", async () => {
    await api.createOrganization(accessToken, "First", "duplicate-test");
    const res = await api.createOrganization(accessToken, "Second", "duplicate-test");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SLUG_ALREADY_TAKEN");
  });

  it("POST /organizations — rejects invalid slug", async () => {
    const res = await api.createOrganization(accessToken, "Test", "Invalid Slug!");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("PATCH /organizations/:id — updates org", async () => {
    const createRes = await api.createOrganization(accessToken, "Old Name", "patch-test");
    const res = await api.updateOrganization(accessToken, createRes.body.id, "New Name", "patch-test-new");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.slug).toBe("patch-test-new");
  });

  it("DELETE /organizations/:id — deletes org", async () => {
    const createRes = await api.createOrganization(accessToken, "To Delete", "delete-test");
    const res = await api.deleteOrganization(accessToken, createRes.body.id);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Organization deleted");
  });

  it("returns 401 without token", async () => {
    const res = await api.listOrganizations("");
    expect(res.status).toBe(401);
  });
});
