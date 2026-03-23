import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps } from "./_test-helpers";
import { GetAgentUsageStats } from "./get-agent-usage-stats";

describe("GetAgentUsageStats", () => {
  it("returns empty current period and history for agent with no runs", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentUsageStats(deps.runRepo);

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const result = await useCase.execute({ agentId: "agent-1" });

    expect(result.currentPeriod).toEqual({
      period: currentPeriod,
      runs: 0,
      tokens: 0,
      cost: 0,
      successRate: 0,
    });
    expect(result.history).toEqual([]);
  });

  it("groups runs by month correctly", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentUsageStats(deps.runRepo);

    // January run
    await deps.runRepo.save(
      Run.create({
        id: "run-1",
        agentId: "agent-1",
        externalRunId: "ext-1",
        status: RunStatus.COMPLETED,
        startedAt: new Date("2026-01-15"),
        completedAt: new Date("2026-01-15"),
        durationMs: 1000,
        tokensUsed: 100,
        cost: 0.05,
        metadata: null,
        error: null,
        createdAt: new Date("2026-01-15"),
      }),
    );

    // February runs
    await deps.runRepo.save(
      Run.create({
        id: "run-2",
        agentId: "agent-1",
        externalRunId: "ext-2",
        status: RunStatus.COMPLETED,
        startedAt: new Date("2026-02-10"),
        completedAt: new Date("2026-02-10"),
        durationMs: 2000,
        tokensUsed: 200,
        cost: 0.10,
        metadata: null,
        error: null,
        createdAt: new Date("2026-02-10"),
      }),
    );
    await deps.runRepo.save(
      Run.create({
        id: "run-3",
        agentId: "agent-1",
        externalRunId: "ext-3",
        status: RunStatus.FAILED,
        startedAt: new Date("2026-02-20"),
        completedAt: new Date("2026-02-20"),
        durationMs: 500,
        tokensUsed: 50,
        cost: 0.02,
        metadata: null,
        error: "error",
        createdAt: new Date("2026-02-20"),
      }),
    );

    // Current month (March 2026) run
    await deps.runRepo.save(
      Run.create({
        id: "run-4",
        agentId: "agent-1",
        externalRunId: "ext-4",
        status: RunStatus.COMPLETED,
        startedAt: new Date("2026-03-05"),
        completedAt: new Date("2026-03-05"),
        durationMs: 1500,
        tokensUsed: 300,
        cost: 0.15,
        metadata: null,
        error: null,
        createdAt: new Date("2026-03-05"),
      }),
    );

    const result = await useCase.execute({ agentId: "agent-1" });

    // Current period is March 2026
    expect(result.currentPeriod).toEqual({
      period: "2026-03",
      runs: 1,
      tokens: 300,
      cost: 0.15,
      successRate: 100,
    });

    // History sorted newest first (excluding current month)
    expect(result.history).toHaveLength(2);
    expect(result.history[0]).toEqual({
      period: "2026-02",
      runs: 2,
      tokens: 250,
      cost: expect.closeTo(0.12, 5),
      successRate: 50,
    });
    expect(result.history[1]).toEqual({
      period: "2026-01",
      runs: 1,
      tokens: 100,
      cost: 0.05,
      successRate: 100,
    });
  });

  it("history is sorted newest first", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentUsageStats(deps.runRepo);

    const months = ["2025-10", "2025-12", "2025-11"];
    for (let i = 0; i < months.length; i++) {
      await deps.runRepo.save(
        Run.create({
          id: `run-${i}`,
          agentId: "agent-1",
          externalRunId: `ext-${i}`,
          status: RunStatus.COMPLETED,
          startedAt: new Date(`${months[i]}-15`),
          completedAt: new Date(`${months[i]}-15`),
          durationMs: 1000,
          tokensUsed: 100,
          cost: 0.01,
          metadata: null,
          error: null,
          createdAt: new Date(`${months[i]}-15`),
        }),
      );
    }

    const result = await useCase.execute({ agentId: "agent-1" });

    // All in history (none in current month March 2026)
    const periods = result.history.map((h) => h.period);
    expect(periods).toEqual(["2025-12", "2025-11", "2025-10"]);
  });
});
