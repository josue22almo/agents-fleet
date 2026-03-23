import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Organization, MemberRole, Slug, OrgType } from "@repo/contexts/iam";
import type { OrganizationRepository } from "@repo/contexts/iam";
import { TestApi } from "../../test-api";

describe("RunsController (e2e)", () => {
  let api: TestApi;
  let accessToken: string;
  let orgId: string;
  let connectionToken: string;
  let agentId: string;

  beforeAll(async () => {
    api = await TestApi.create();

    accessToken = await api.signupAndLogin("runs-ctrl@example.com", "password123", "Runs Tester");

    const profileRes = await api.getProfile(accessToken);
    const userId = profileRes.body.id;

    const orgRepo = api.getModuleRef().get<OrganizationRepository>("OrganizationRepository");
    orgId = "org-runs-ctrl-test";
    const org = Organization.create({
      id: orgId,
      name: "Runs Ctrl Org",
      slug: new Slug("runs-ctrl-org"),
      type: OrgType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org.addMember("member-runs-1", userId, MemberRole.OWNER);
    await orgRepo.save(org);

    const createRes = await api.createAgent(accessToken, {
      name: "Runs Ctrl Agent",
      type: "claude",
      organizationId: orgId,
    });
    agentId = createRes.body.id;
    connectionToken = createRes.body.connectionToken;

    // Ingest some runs for chart/comparison/usage data
    await api.ingestEvent(connectionToken, {
      event: "run.started",
      runId: "chart-run-1",
    });
    await api.ingestEvent(connectionToken, {
      event: "run.completed",
      runId: "chart-run-1",
      data: { durationMs: 1000, tokensUsed: 50, cost: 0.01 },
    });
    await api.ingestEvent(connectionToken, {
      event: "run.started",
      runId: "chart-run-2",
    });
    await api.ingestEvent(connectionToken, {
      event: "run.failed",
      runId: "chart-run-2",
      data: { error: "timeout" },
    });
  });

  afterAll(async () => {
    await api.close();
  });

  it("GET /dashboard/charts returns chart data", async () => {
    const res = await api.getDashboardCharts(accessToken, orgId);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("durationHistogram");
    expect(res.body).toHaveProperty("tokensByAgent");
    expect(res.body).toHaveProperty("errorBreakdown");
    expect(Array.isArray(res.body.durationHistogram)).toBe(true);
    expect(Array.isArray(res.body.tokensByAgent)).toBe(true);
    expect(Array.isArray(res.body.errorBreakdown)).toBe(true);
  });

  it("GET /dashboard/comparison returns comparison array", async () => {
    const res = await api.getDashboardComparison(accessToken, orgId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("agentId");
    expect(res.body[0]).toHaveProperty("totalRuns");
    expect(res.body[0]).toHaveProperty("successRate");
  });

  it("GET /agents/:id/usage returns usage stats", async () => {
    const res = await api.getAgentUsage(accessToken, agentId);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("currentPeriod");
    expect(res.body).toHaveProperty("history");
    expect(res.body.currentPeriod).toHaveProperty("runs");
    expect(res.body.currentPeriod).toHaveProperty("tokens");
  });

  it("GET /agents/:id/charts returns agent chart data", async () => {
    const res = await api.getAgentCharts(accessToken, agentId);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("durationHistogram");
    expect(res.body).toHaveProperty("tokensByAgent");
    expect(res.body).toHaveProperty("errorBreakdown");
  });

  it("GET /agents/:id/tools returns tool summaries (empty initially)", async () => {
    const res = await api.getAgentTools(accessToken, agentId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("GET /agents/:id/tools returns summaries after tool.called ingest", async () => {
    // Ingest tool calls
    await api.ingestEvent(connectionToken, {
      event: "tool.called",
      runId: "chart-run-1",
      data: { toolName: "readFile", durationMs: 100, success: true },
    });
    await api.ingestEvent(connectionToken, {
      event: "tool.called",
      runId: "chart-run-1",
      data: { toolName: "readFile", durationMs: 200, success: false },
    });
    await api.ingestEvent(connectionToken, {
      event: "tool.called",
      runId: "chart-run-1",
      data: { toolName: "writeFile", durationMs: 50, success: true },
    });

    const res = await api.getAgentTools(accessToken, agentId);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);

    const readFile = res.body.find((t: { toolName: string }) => t.toolName === "readFile");
    expect(readFile).toBeDefined();
    expect(readFile.calls).toBe(2);
    expect(readFile.avgDurationMs).toBe(150);
    expect(readFile.successRate).toBe(0.5);
  });
});
