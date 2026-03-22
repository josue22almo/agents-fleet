import { describe, it, expect } from "vitest";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps } from "./_test-helpers";
import { ListRuns } from "./list-runs";

describe("ListRuns", () => {
  it("returns paginated runs for an agent sorted by most recent", async () => {
    const deps = createTestDeps();
    const listRuns = new ListRuns(deps.runRepo);

    // Create 3 runs with different start times
    const run1 = Run.create({
      id: "run-1",
      agentId: "agent-1",
      externalRunId: "ext-1",
      status: RunStatus.COMPLETED,
      startedAt: new Date("2024-01-01"),
      completedAt: new Date("2024-01-01"),
      durationMs: 100,
      tokensUsed: null,
      cost: null,
      metadata: null,
      error: null,
      createdAt: new Date("2024-01-01"),
    });
    const run2 = Run.create({
      id: "run-2",
      agentId: "agent-1",
      externalRunId: "ext-2",
      status: RunStatus.RUNNING,
      startedAt: new Date("2024-01-03"),
      completedAt: null,
      durationMs: null,
      tokensUsed: null,
      cost: null,
      metadata: null,
      error: null,
      createdAt: new Date("2024-01-03"),
    });
    const run3 = Run.create({
      id: "run-3",
      agentId: "agent-1",
      externalRunId: "ext-3",
      status: RunStatus.COMPLETED,
      startedAt: new Date("2024-01-02"),
      completedAt: new Date("2024-01-02"),
      durationMs: 200,
      tokensUsed: null,
      cost: null,
      metadata: null,
      error: null,
      createdAt: new Date("2024-01-02"),
    });

    await deps.runRepo.save(run1);
    await deps.runRepo.save(run2);
    await deps.runRepo.save(run3);

    const result = await listRuns.execute({ agentId: "agent-1", page: 1, pageSize: 10 });

    expect(result.total).toBe(3);
    expect(result.runs).toHaveLength(3);
    // Most recent first
    expect(result.runs[0]!.id).toBe("run-2");
    expect(result.runs[1]!.id).toBe("run-3");
    expect(result.runs[2]!.id).toBe("run-1");
  });

  it("paginates correctly", async () => {
    const deps = createTestDeps();
    const listRuns = new ListRuns(deps.runRepo);

    for (let i = 0; i < 5; i++) {
      const run = Run.start({
        id: `run-${i}`,
        agentId: "agent-1",
        externalRunId: `ext-${i}`,
      });
      await deps.runRepo.save(run);
    }

    const page1 = await listRuns.execute({ agentId: "agent-1", page: 1, pageSize: 2 });
    expect(page1.runs).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);

    const page2 = await listRuns.execute({ agentId: "agent-1", page: 2, pageSize: 2 });
    expect(page2.runs).toHaveLength(2);
  });

  it("filters by agentId", async () => {
    const deps = createTestDeps();
    const listRuns = new ListRuns(deps.runRepo);

    await deps.runRepo.save(
      Run.start({ id: "run-1", agentId: "agent-1", externalRunId: "ext-1" }),
    );
    await deps.runRepo.save(
      Run.start({ id: "run-2", agentId: "agent-2", externalRunId: "ext-2" }),
    );

    const result = await listRuns.execute({ agentId: "agent-1" });
    expect(result.total).toBe(1);
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]!.id).toBe("run-1");
  });

  it("defaults to page 1 with pageSize 20", async () => {
    const deps = createTestDeps();
    const listRuns = new ListRuns(deps.runRepo);

    const result = await listRuns.execute({ agentId: "agent-1" });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
