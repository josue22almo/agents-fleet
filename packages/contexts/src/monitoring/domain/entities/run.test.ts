import { describe, it, expect } from "vitest";
import { Run } from "./run";
import { RunStatus } from "../value-objects/run-status";

describe("Run", () => {
  it("creates a running run via static start()", () => {
    const run = Run.start({
      id: "run-1",
      agentId: "agent-1",
      externalRunId: "ext-1",
    });

    const p = run.toPrimitives();
    expect(p.id).toBe("run-1");
    expect(p.agentId).toBe("agent-1");
    expect(p.externalRunId).toBe("ext-1");
    expect(p.status).toBe(RunStatus.RUNNING);
    expect(run.isRunning).toBe(true);
    expect(run.isFinished).toBe(false);
  });

  it("completes a run with metrics", () => {
    const run = Run.start({
      id: "run-1",
      agentId: "agent-1",
      externalRunId: "ext-1",
    });

    run.complete({
      durationMs: 1500,
      tokensUsed: 200,
      cost: 0.05,
      metadata: { model: "claude-4" },
    });

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.COMPLETED);
    expect(p.durationMs).toBe(1500);
    expect(p.tokensUsed).toBe(200);
    expect(p.cost).toBe(0.05);
    expect(p.metadata).toEqual({ model: "claude-4" });
    expect(p.completedAt).toBeInstanceOf(Date);
    expect(run.isCompleted).toBe(true);
    expect(run.isFinished).toBe(true);
  });

  it("fails a run with an error message", () => {
    const run = Run.start({
      id: "run-1",
      agentId: "agent-1",
      externalRunId: "ext-1",
    });

    run.fail("Something went wrong");

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.FAILED);
    expect(p.error).toBe("Something went wrong");
    expect(p.completedAt).toBeInstanceOf(Date);
    expect(run.isFailed).toBe(true);
    expect(run.isFinished).toBe(true);
  });

  it("can be restored from primitives via create()", () => {
    const now = new Date();
    const run = Run.create({
      id: "run-2",
      agentId: "agent-2",
      externalRunId: "ext-2",
      status: RunStatus.COMPLETED,
      startedAt: now,
      completedAt: now,
      durationMs: 500,
      tokensUsed: 100,
      cost: 0.01,
      metadata: { key: "val" },
      error: null,
      createdAt: now,
    });

    expect(run.isCompleted).toBe(true);
    expect(run.toPrimitives().durationMs).toBe(500);
  });

  it("start() resets status and startedAt", () => {
    const run = Run.create({
      id: "run-3",
      agentId: "agent-3",
      externalRunId: null,
      status: RunStatus.FAILED,
      startedAt: new Date("2024-01-01"),
      completedAt: new Date("2024-01-01"),
      durationMs: null,
      tokensUsed: null,
      cost: null,
      metadata: null,
      error: "old error",
      createdAt: new Date("2024-01-01"),
    });

    run.start();

    expect(run.isRunning).toBe(true);
    expect(run.toPrimitives().startedAt.getTime()).toBeGreaterThan(
      new Date("2024-01-01").getTime(),
    );
  });

  it("completes a run with no metrics", () => {
    const run = Run.start({
      id: "run-4",
      agentId: "agent-4",
      externalRunId: null,
    });

    run.complete();

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.COMPLETED);
    expect(p.durationMs).toBeNull();
    expect(p.tokensUsed).toBeNull();
    expect(p.cost).toBeNull();
  });

  it("fails a run with no error message", () => {
    const run = Run.start({
      id: "run-5",
      agentId: "agent-5",
      externalRunId: null,
    });

    run.fail();

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.FAILED);
    expect(p.error).toBeNull();
  });

  it("merges metadata on complete", () => {
    const run = Run.start({
      id: "run-6",
      agentId: "agent-6",
      externalRunId: null,
      metadata: { initial: true },
    });

    run.complete({ metadata: { final: true } });

    const p = run.toPrimitives();
    expect(p.metadata).toEqual({ initial: true, final: true });
  });
});
