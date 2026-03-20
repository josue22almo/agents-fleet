import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TestApi } from "../../test-api";

describe("MembersController (e2e)", () => {
  let api: TestApi;
  let accessToken: string;
  let orgId: string;

  beforeAll(async () => {
    api = await TestApi.create();
    accessToken = await api.signupAndLogin("member-owner@example.com", "password123", "Owner");
    const orgRes = await api.createOrganization(accessToken, "Member Test Org", "member-test");
    orgId = orgRes.body.id;
  });

  afterAll(async () => {
    await api.close();
  });

  it("GET /organizations/:id/members — lists members", async () => {
    const res = await api.listMembers(accessToken, orgId);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /organizations/:id/members — invites a member", async () => {
    const res = await api.inviteMember(accessToken, orgId, "invited@example.com", "member");
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("invited@example.com");
    expect(res.body.status).toBe("pending");
  });

  it("POST /organizations/:id/members — rejects owner role invite", async () => {
    const res = await api.inviteMember(accessToken, orgId, "bad@example.com", "owner");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /organizations/:id/members — rejects invalid email", async () => {
    const res = await api.inviteMember(accessToken, orgId, "not-an-email", "member");
    expect(res.status).toBe(400);
  });
});
