import { describe, it, expect } from "vitest";
import { RunStatus } from "../../domain/value-objects/run-status";
import { createTestDeps } from "./_test-helpers";
import { IngestEvent } from "./ingest-event";

describe("IngestEvent", () => {
  it("creates a run on run.started", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run = await ingest.execute({
      agentId: "agent-1",
      event: "run.started",
      externalRunId: "ext-1",
    });

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.RUNNING);
    expect(p.agentId).toBe("agent-1");
    expect(p.externalRunId).toBe("ext-1");
  });

  it("is idempotent for duplicate run.started", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run1 = await ingest.execute({
      agentId: "agent-1",
      event: "run.started",
      externalRunId: "ext-1",
    });
    const run2 = await ingest.execute({
      agentId: "agent-1",
      event: "run.started",
      externalRunId: "ext-1",
    });

    expect(run1.id).toBe(run2.id);
  });

  it("completes an existing run on run.completed", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    await ingest.execute({
      agentId: "agent-1",
      event: "run.started",
      externalRunId: "ext-1",
    });

    const run = await ingest.execute({
      agentId: "agent-1",
      event: "run.completed",
      externalRunId: "ext-1",
      data: { durationMs: 1000, tokensUsed: 150, cost: 0.03 },
    });

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.COMPLETED);
    expect(p.durationMs).toBe(1000);
    expect(p.tokensUsed).toBe(150);
    expect(p.cost).toBe(0.03);
  });

  it("creates run implicitly on run.completed without prior start", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run = await ingest.execute({
      agentId: "agent-1",
      event: "run.completed",
      externalRunId: "ext-1",
      data: { durationMs: 500 },
    });

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.COMPLETED);
    expect(p.durationMs).toBe(500);
    expect(p.agentId).toBe("agent-1");
  });

  it("fails an existing run on run.failed", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    await ingest.execute({
      agentId: "agent-1",
      event: "run.started",
      externalRunId: "ext-1",
    });

    const run = await ingest.execute({
      agentId: "agent-1",
      event: "run.failed",
      externalRunId: "ext-1",
      data: { error: "timeout" },
    });

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.FAILED);
    expect(p.error).toBe("timeout");
  });

  it("creates run implicitly on run.failed without prior start", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run = await ingest.execute({
      agentId: "agent-1",
      event: "run.failed",
      externalRunId: "ext-1",
      data: { error: "crash" },
    });

    const p = run.toPrimitives();
    expect(p.status).toBe(RunStatus.FAILED);
    expect(p.error).toBe("crash");
  });

  it("is idempotent for duplicate run.completed", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run1 = await ingest.execute({
      agentId: "agent-1",
      event: "run.completed",
      externalRunId: "ext-1",
      data: { durationMs: 500 },
    });

    const run2 = await ingest.execute({
      agentId: "agent-1",
      event: "run.completed",
      externalRunId: "ext-1",
      data: { durationMs: 999 },
    });

    expect(run1.id).toBe(run2.id);
    // Original metrics preserved
    expect(run2.toPrimitives().durationMs).toBe(500);
  });

  it("is idempotent for duplicate run.failed", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run1 = await ingest.execute({
      agentId: "agent-1",
      event: "run.failed",
      externalRunId: "ext-1",
      data: { error: "first" },
    });

    const run2 = await ingest.execute({
      agentId: "agent-1",
      event: "run.failed",
      externalRunId: "ext-1",
      data: { error: "second" },
    });

    expect(run1.id).toBe(run2.id);
    expect(run2.toPrimitives().error).toBe("first");
  });

  it("stores metadata from run.started", async () => {
    const deps = createTestDeps();
    const ingest = new IngestEvent(deps.runRepo, deps.idGenerator);

    const run = await ingest.execute({
      agentId: "agent-1",
      event: "run.started",
      externalRunId: "ext-1",
      data: { metadata: { model: "claude-4" } },
    });

    expect(run.toPrimitives().metadata).toEqual({ model: "claude-4" });
  });
});
