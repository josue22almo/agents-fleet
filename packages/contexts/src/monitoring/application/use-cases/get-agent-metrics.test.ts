import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps } from "./_test-helpers";
import { GetAgentMetrics } from "./get-agent-metrics";

describe("GetAgentMetrics", () => {
  it("returns zero metrics when no runs exist", async () => {
    const deps = createTestDeps();
    const getMetrics = new GetAgentMetrics(deps.runRepo);

    const metrics = await getMetrics.execute("agent-1");
    const p = metrics.toPrimitives();

    expect(p.totalRuns).toBe(0);
    expect(p.successRate).toBe(0);
    expect(p.avgDurationMs).toBe(0);
    expect(p.totalCost).toBe(0);
    expect(p.activeRuns).toBe(0);
    expect(metrics.hasRuns).toBe(false);
  });

  it("aggregates metrics from multiple runs", async () => {
    const deps = createTestDeps();
    const getMetrics = new GetAgentMetrics(deps.runRepo);

    // 1 completed run
    const run1 = Run.create({
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
    });

    // 1 completed run
    const run2 = Run.create({
      id: "run-2",
      agentId: "agent-1",
      externalRunId: "ext-2",
      status: RunStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 2000,
      tokensUsed: 200,
      cost: 0.10,
      metadata: null,
      error: null,
      createdAt: new Date(),
    });

    // 1 failed run
    const run3 = Run.create({
      id: "run-3",
      agentId: "agent-1",
      externalRunId: "ext-3",
      status: RunStatus.FAILED,
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 500,
      tokensUsed: 50,
      cost: 0.02,
      metadata: null,
      error: "timeout",
      createdAt: new Date(),
    });

    // 1 running
    const run4 = Run.start({
      id: "run-4",
      agentId: "agent-1",
      externalRunId: "ext-4",
    });

    await deps.runRepo.save(run1);
    await deps.runRepo.save(run2);
    await deps.runRepo.save(run3);
    await deps.runRepo.save(run4);

    const metrics = await getMetrics.execute("agent-1");
    const p = metrics.toPrimitives();

    expect(p.totalRuns).toBe(4);
    expect(p.successRate).toBe(0.5); // 2 completed out of 4
    expect(p.avgDurationMs).toBe((1000 + 2000 + 500) / 3); // 3 runs have duration
    expect(p.totalCost).toBeCloseTo(0.17);
    expect(p.activeRuns).toBe(1);
    expect(metrics.hasRuns).toBe(true);
    expect(metrics.hasActiveRuns).toBe(true);
  });

  it("only counts runs for the specified agent", async () => {
    const deps = createTestDeps();
    const getMetrics = new GetAgentMetrics(deps.runRepo);

    await deps.runRepo.save(
      Run.start({ id: "run-1", agentId: "agent-1", externalRunId: "ext-1" }),
    );
    await deps.runRepo.save(
      Run.start({ id: "run-2", agentId: "agent-2", externalRunId: "ext-2" }),
    );

    const metrics = await getMetrics.execute("agent-1");
    expect(metrics.toPrimitives().totalRuns).toBe(1);
  });
});
