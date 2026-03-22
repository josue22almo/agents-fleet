import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Organization, MemberRole, Slug, OrgType } from "@repo/contexts/iam";
import type { OrganizationRepository } from "@repo/contexts/iam";
import { TestApi } from "../../test-api";

describe("AgentsController (e2e)", () => {
  let api: TestApi;
  let accessToken: string;
  let orgId: string;

  beforeAll(async () => {
    api = await TestApi.create();

    // Sign up and login
    accessToken = await api.signupAndLogin("agent-test@example.com", "password123", "Agent Tester");

    // Get the user ID from the token
    const profileRes = await api.getProfile(accessToken);
    const userId = profileRes.body.id;

    // Seed an organization in the agents module's org repository
    const orgRepo = api.getModuleRef().get<OrganizationRepository>("OrganizationRepository");
    orgId = "org-agents-test";
    const org = Organization.create({
      id: orgId,
      name: "Test Org",
      slug: new Slug("test-org-agents"),
      type: OrgType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org.addMember("member-1", userId, MemberRole.OWNER);
    await orgRepo.save(org);
  });

  afterAll(async () => {
    await api.close();
  });

  it("POST /agents — creates an agent and returns token", async () => {
    const res = await api.createAgent(accessToken, {
      name: "My Claude Agent",
      type: "claude",
      organizationId: orgId,
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My Claude Agent");
    expect(res.body.type).toBe("claude");
    expect(res.body.status).toBe("inactive");
    expect(res.body.connectionToken).toBeDefined();
    expect(res.body.connectionToken).toMatch(/^af_/);
    expect(res.body.tokenPrefix).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  it("POST /agents — rejects missing name", async () => {
    const res = await api.createAgent(accessToken, {
      name: "",
      type: "claude",
      organizationId: orgId,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /agents — lists agents for organization", async () => {
    const res = await api.listAgents(accessToken, orgId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].name).toBeDefined();
    expect(res.body[0].type).toBeDefined();
  });

  it("GET /agents/:id — returns agent detail", async () => {
    // First create an agent
    const createRes = await api.createAgent(accessToken, {
      name: "Detail Agent",
      type: "custom",
      organizationId: orgId,
    });
    const agentId = createRes.body.id;

    const res = await api.getAgent(accessToken, agentId, orgId);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(agentId);
    expect(res.body.name).toBe("Detail Agent");
    expect(res.body.tokenPrefix).toBeDefined();
  });

  it("PATCH /agents/:id — updates agent name", async () => {
    const createRes = await api.createAgent(accessToken, {
      name: "Old Name",
      type: "manus",
      organizationId: orgId,
    });
    const agentId = createRes.body.id;

    const res = await api.updateAgent(accessToken, agentId, orgId, { name: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
  });

  it("DELETE /agents/:id — deletes agent", async () => {
    const createRes = await api.createAgent(accessToken, {
      name: "To Delete",
      type: "custom",
      organizationId: orgId,
    });
    const agentId = createRes.body.id;

    const res = await api.deleteAgent(accessToken, agentId, orgId);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Agent deleted");

    // Verify it's gone from the list
    const listRes = await api.listAgents(accessToken, orgId);
    const found = listRes.body.find((a: { id: string }) => a.id === agentId);
    expect(found).toBeUndefined();
  });

  it("POST /agents/:id/regenerate-token — returns new token", async () => {
    const createRes = await api.createAgent(accessToken, {
      name: "Regen Agent",
      type: "claude",
      organizationId: orgId,
    });
    const agentId = createRes.body.id;
    const oldToken = createRes.body.connectionToken;

    const res = await api.regenerateAgentToken(accessToken, agentId, orgId);
    expect(res.status).toBe(201);
    expect(res.body.connectionToken).toBeDefined();
    expect(res.body.connectionToken).not.toBe(oldToken);
  });

  it("GET /agents/:id — returns 404 for non-existent agent", async () => {
    const res = await api.getAgent(accessToken, "non-existent-id", orgId);
    expect(res.status).toBe(404);
  });

  it("returns 401 without token", async () => {
    const res = await api.listAgents("", orgId);
    expect(res.status).toBe(401);
  });
});
