import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Organization, MemberRole, Slug, OrgType } from "@repo/contexts/iam";
import type { OrganizationRepository } from "@repo/contexts/iam";
import { TestApi } from "../../test-api";

describe("IngestController (e2e)", () => {
  let api: TestApi;
  let accessToken: string;
  let orgId: string;
  let connectionToken: string;
  let agentId: string;

  beforeAll(async () => {
    api = await TestApi.create();

    accessToken = await api.signupAndLogin("ingest-test@example.com", "password123", "Ingest Tester");

    const profileRes = await api.getProfile(accessToken);
    const userId = profileRes.body.id;

    // Seed organization
    const orgRepo = api.getModuleRef().get<OrganizationRepository>("OrganizationRepository");
    orgId = "org-ingest-test";
    const org = Organization.create({
      id: orgId,
      name: "Ingest Org",
      slug: new Slug("ingest-org"),
      type: OrgType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org.addMember("member-ingest-1", userId, MemberRole.OWNER);
    await orgRepo.save(org);

    // Create an agent to get a connection token
    const createRes = await api.createAgent(accessToken, {
      name: "Ingest Agent",
      type: "claude",
      organizationId: orgId,
    });
    agentId = createRes.body.id;
    connectionToken = createRes.body.connectionToken;
  });

  afterAll(async () => {
    await api.close();
  });

  it("POST /ingest — ingests run.started event", async () => {
    const res = await api.ingestEvent(connectionToken, {
      event: "run.started",
      runId: "run-1",
    });
    expect(res.status).toBe(201);
    expect(res.body.agentId).toBe(agentId);
    expect(res.body.externalRunId).toBe("run-1");
    expect(res.body.status).toBe("running");
  });

  it("POST /ingest — ingests run.completed event", async () => {
    const res = await api.ingestEvent(connectionToken, {
      event: "run.completed",
      runId: "run-1",
      data: { durationMs: 1500, tokensUsed: 100, cost: 0.05 },
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("completed");
    expect(res.body.durationMs).toBe(1500);
  });

  it("POST /ingest — ingests run.failed event", async () => {
    const res = await api.ingestEvent(connectionToken, {
      event: "run.failed",
      runId: "run-fail-1",
      data: { error: "Something went wrong" },
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("failed");
    expect(res.body.error).toBe("Something went wrong");
  });

  it("POST /ingest — rejects invalid event type", async () => {
    const res = await api.ingestEvent(connectionToken, {
      event: "run.invalid" as "run.started",
      runId: "run-2",
    });
    expect(res.status).toBe(400);
  });

  it("POST /ingest — rejects missing runId", async () => {
    const res = await api.ingestEvent(connectionToken, {
      event: "run.started",
      runId: "",
    });
    expect(res.status).toBe(400);
  });

  it("POST /ingest — rejects invalid connection token", async () => {
    const res = await api.ingestEvent("invalid-token", {
      event: "run.started",
      runId: "run-3",
    });
    expect(res.status).toBe(401);
  });

  it("POST /ingest — updates agent to active", async () => {
    // Ingest an event
    await api.ingestEvent(connectionToken, {
      event: "run.started",
      runId: "run-active-check",
    });

    // Check agent is now active
    const agentRes = await api.getAgent(accessToken, agentId, orgId);
    expect(agentRes.body.status).toBe("active");
    expect(agentRes.body.lastSeenAt).toBeDefined();
  });
});
