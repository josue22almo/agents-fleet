import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps } from "./_test-helpers";
import { GetAgentComparison } from "./get-agent-comparison";

describe("GetAgentComparison", () => {
  it("returns empty array for empty agentIds", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentComparison(deps.runRepo);

    const result = await useCase.execute({ agentIds: [] });

    expect(result).toEqual([]);
  });

  it("returns empty array when agents have no runs", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentComparison(deps.runRepo);

    const result = await useCase.execute({ agentIds: ["agent-1"] });

    expect(result).toEqual([]);
  });

  it("compares multiple agents sorted by totalRuns desc", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentComparison(deps.runRepo);

    // Agent 1: 3 runs (2 completed, 1 failed)
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
    await deps.runRepo.save(
      Run.create({
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
      }),
    );
    await deps.runRepo.save(
      Run.create({
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
      }),
    );

    // Agent 2: 1 completed run
    await deps.runRepo.save(
      Run.create({
        id: "run-4",
        agentId: "agent-2",
        externalRunId: "ext-4",
        status: RunStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 3000,
        tokensUsed: 500,
        cost: 0.20,
        metadata: null,
        error: null,
        createdAt: new Date(),
      }),
    );

    const result = await useCase.execute({
      agentIds: ["agent-1", "agent-2"],
    });

    expect(result).toHaveLength(2);

    // Agent 1 first (more runs)
    expect(result[0]).toEqual({
      agentId: "agent-1",
      totalRuns: 3,
      completedRuns: 2,
      failedRuns: 1,
      successRate: expect.closeTo(66.67, 1),
      avgDurationMs: expect.closeTo(1166.67, 0),
      totalTokensUsed: 350,
      totalCost: expect.closeTo(0.17, 2),
    });

    // Agent 2 second
    expect(result[1]).toEqual({
      agentId: "agent-2",
      totalRuns: 1,
      completedRuns: 1,
      failedRuns: 0,
      successRate: 100,
      avgDurationMs: 3000,
      totalTokensUsed: 500,
      totalCost: 0.20,
    });
  });

  it("calculates correct success rate", async () => {
    const deps = createTestDeps();
    const useCase = new GetAgentComparison(deps.runRepo);

    // 1 completed, 1 failed => 50%
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
    await deps.runRepo.save(
      Run.create({
        id: "run-2",
        agentId: "agent-1",
        externalRunId: "ext-2",
        status: RunStatus.FAILED,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 500,
        tokensUsed: null,
        cost: null,
        metadata: null,
        error: "error",
        createdAt: new Date(),
      }),
    );

    const result = await useCase.execute({ agentIds: ["agent-1"] });

    expect(result[0]!.successRate).toBe(50);
  });
});
