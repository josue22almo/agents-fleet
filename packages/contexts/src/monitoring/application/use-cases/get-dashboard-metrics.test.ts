import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps, createStubAgentsPort } from "./_test-helpers";
import { GetDashboardMetrics } from "./get-dashboard-metrics";

describe("GetDashboardMetrics", () => {
  it("returns zero metrics for org with no agents", async () => {
    const deps = createTestDeps();
    const getDashboard = new GetDashboardMetrics(deps.runRepo, createStubAgentsPort([], {}));

    const result = await getDashboard.execute("empty-org");

    expect(result.toPrimitives().totalAgents).toBe(0);
    expect(result.toPrimitives().totalRuns).toBe(0);
    expect(result.toPrimitives().successRate).toBe(0);
    expect(result.toPrimitives().avgDurationMs).toBe(0);
    expect(result.toPrimitives().totalCost).toBe(0);
    expect(result.toPrimitives().activeRuns).toBe(0);
  });

  it("aggregates metrics across multiple agents", async () => {
    const deps = createTestDeps();
    const getDashboard = new GetDashboardMetrics(
      deps.runRepo,
      createStubAgentsPort(["agent-1", "agent-2"]),
    );

    // Agent 1: 1 completed run
    await deps.runRepo.save(
      Run.create({
        id: "run-1",
        agentId: "agent-1",
        externalRunId: "ext-1",
        status: RunStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1000,
        tokensUsed: 100,
        cost: 0.05,
        metadata: null,
        error: null,
        createdAt: new Date(),
      }),
    );

    // Agent 2: 1 running, 1 failed
    await deps.runRepo.save(
      Run.start({ id: "run-2", agentId: "agent-2", externalRunId: "ext-2" }),
    );
    await deps.runRepo.save(
      Run.create({
        id: "run-3",
        agentId: "agent-2",
        externalRunId: "ext-3",
        status: RunStatus.FAILED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 500,
        tokensUsed: null,
        cost: 0.02,
        metadata: null,
        error: "error",
        createdAt: new Date(),
      }),
    );

    // Agent 3 (NOT in org): should be excluded
    await deps.runRepo.save(
      Run.start({ id: "run-4", agentId: "agent-3", externalRunId: "ext-4" }),
    );

    const result = await getDashboard.execute("org-1");

    expect(result.toPrimitives().totalAgents).toBe(2);
    expect(result.toPrimitives().totalRuns).toBe(3);
    expect(result.toPrimitives().successRate).toBeCloseTo(1 / 3);
    expect(result.toPrimitives().avgDurationMs).toBe((1000 + 500) / 2);
    expect(result.toPrimitives().totalCost).toBeCloseTo(0.07);
    expect(result.toPrimitives().activeRuns).toBe(1);
  });

  it("returns zero metrics when agents have no runs", async () => {
    const deps = createTestDeps();
    const getDashboard = new GetDashboardMetrics(
      deps.runRepo,
      createStubAgentsPort(["agent-1", "agent-2"]),
    );

    const result = await getDashboard.execute("org-1");

    expect(result.toPrimitives().totalAgents).toBe(2);
    expect(result.toPrimitives().totalRuns).toBe(0);
    expect(result.toPrimitives().successRate).toBe(0);
  });
});
