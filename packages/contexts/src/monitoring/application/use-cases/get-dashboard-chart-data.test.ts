import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps } from "./_test-helpers";
import { GetDashboardChartData } from "./get-dashboard-chart-data";

describe("GetDashboardChartData", () => {
  it("returns empty arrays for empty agentIds", async () => {
    const deps = createTestDeps();
    const useCase = new GetDashboardChartData(deps.runRepo);

    const result = await useCase.execute({ agentIds: [] });

    expect(result.durationHistogram).toEqual([]);
    expect(result.tokensByAgent).toEqual([]);
    expect(result.errorBreakdown).toEqual([]);
  });

  it("builds duration histogram with correct buckets", async () => {
    const deps = createTestDeps();
    const useCase = new GetDashboardChartData(deps.runRepo);

    const durations = [500, 2000, 4000, 7000, 15000]; // <1s, 1-3s, 3-5s, 5-10s, >10s
    for (let i = 0; i < durations.length; i++) {
      await deps.runRepo.save(
        Run.create({
          id: `run-${i}`,
          agentId: "agent-1",
          externalRunId: `ext-${i}`,
          status: RunStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: durations[i]!,
          tokensUsed: 100,
          cost: 0.01,
          metadata: null,
          error: null,
          createdAt: new Date(),
        }),
      );
    }

    const result = await useCase.execute({ agentIds: ["agent-1"] });

    expect(result.durationHistogram).toEqual([
      { bucket: "<1s", count: 1 },
      { bucket: "1-3s", count: 1 },
      { bucket: "3-5s", count: 1 },
      { bucket: "5-10s", count: 1 },
      { bucket: ">10s", count: 1 },
    ]);
  });

  it("omits zero-count buckets from histogram", async () => {
    const deps = createTestDeps();
    const useCase = new GetDashboardChartData(deps.runRepo);

    await deps.runRepo.save(
      Run.create({
        id: "run-1",
        agentId: "agent-1",
        externalRunId: "ext-1",
        status: RunStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 500,
        tokensUsed: 100,
        cost: 0.01,
        metadata: null,
        error: null,
        createdAt: new Date(),
      }),
    );

    const result = await useCase.execute({ agentIds: ["agent-1"] });

    expect(result.durationHistogram).toEqual([{ bucket: "<1s", count: 1 }]);
  });

  it("groups tokens by agent sorted desc", async () => {
    const deps = createTestDeps();
    const useCase = new GetDashboardChartData(deps.runRepo);

    // Agent 1: 100 tokens
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
        cost: 0.01,
        metadata: null,
        error: null,
        createdAt: new Date(),
      }),
    );

    // Agent 2: 300 tokens (two runs)
    await deps.runRepo.save(
      Run.create({
        id: "run-2",
        agentId: "agent-2",
        externalRunId: "ext-2",
        status: RunStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1000,
        tokensUsed: 200,
        cost: 0.01,
        metadata: null,
        error: null,
        createdAt: new Date(),
      }),
    );
    await deps.runRepo.save(
      Run.create({
        id: "run-3",
        agentId: "agent-2",
        externalRunId: "ext-3",
        status: RunStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 1000,
        tokensUsed: 100,
        cost: 0.01,
        metadata: null,
        error: null,
        createdAt: new Date(),
      }),
    );

    const result = await useCase.execute({
      agentIds: ["agent-1", "agent-2"],
    });

    expect(result.tokensByAgent).toEqual([
      { agentId: "agent-2", tokens: 300 },
      { agentId: "agent-1", tokens: 100 },
    ]);
  });

  it("groups errors by type sorted by count desc", async () => {
    const deps = createTestDeps();
    const useCase = new GetDashboardChartData(deps.runRepo);

    const errors = ["timeout", "timeout", "timeout", "rate_limit", "crash"];
    for (let i = 0; i < errors.length; i++) {
      await deps.runRepo.save(
        Run.create({
          id: `run-${i}`,
          agentId: "agent-1",
          externalRunId: `ext-${i}`,
          status: RunStatus.FAILED,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 1000,
          tokensUsed: null,
          cost: null,
          metadata: null,
          error: errors[i]!,
          createdAt: new Date(),
        }),
      );
    }

    const result = await useCase.execute({ agentIds: ["agent-1"] });

    expect(result.errorBreakdown).toEqual([
      { type: "timeout", count: 3 },
      { type: "rate_limit", count: 1 },
      { type: "crash", count: 1 },
    ]);
  });
});
