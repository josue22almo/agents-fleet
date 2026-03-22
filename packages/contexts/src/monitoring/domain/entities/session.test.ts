import { describe, it, expect } from "vitest";
import { Session } from "./session";
import { SessionStatus } from "../value-objects/session-status";

describe("Session", () => {
  it("creates an active session via static start()", () => {
    const session = Session.start({
      id: "session-1",
      agentId: "agent-1",
      name: "Code review",
    });

    const p = session.toPrimitives();
    expect(p.id).toBe("session-1");
    expect(p.agentId).toBe("agent-1");
    expect(p.name).toBe("Code review");
    expect(p.status).toBe(SessionStatus.ACTIVE);
    expect(p.runCount).toBe(0);
    expect(session.isActive).toBe(true);
    expect(session.isFinished).toBe(false);
  });

  it("creates a session without a name", () => {
    const session = Session.start({
      id: "session-2",
      agentId: "agent-1",
    });

    expect(session.toPrimitives().name).toBeNull();
  });

  it("completes a session with metrics", () => {
    const session = Session.start({
      id: "session-1",
      agentId: "agent-1",
    });

    session.complete({
      totalDurationMs: 5000,
      totalTokensUsed: 1200,
      totalCost: 0.25,
    });

    const p = session.toPrimitives();
    expect(p.status).toBe(SessionStatus.COMPLETED);
    expect(p.totalDurationMs).toBe(5000);
    expect(p.totalTokensUsed).toBe(1200);
    expect(p.totalCost).toBe(0.25);
    expect(p.completedAt).toBeInstanceOf(Date);
    expect(session.isCompleted).toBe(true);
    expect(session.isFinished).toBe(true);
  });

  it("fails a session", () => {
    const session = Session.start({
      id: "session-1",
      agentId: "agent-1",
    });

    session.fail();

    const p = session.toPrimitives();
    expect(p.status).toBe(SessionStatus.FAILED);
    expect(p.completedAt).toBeInstanceOf(Date);
    expect(session.isFailed).toBe(true);
    expect(session.isFinished).toBe(true);
  });

  it("increments run count via addRun()", () => {
    const session = Session.start({
      id: "session-1",
      agentId: "agent-1",
    });

    session.addRun();
    session.addRun();
    session.addRun();

    expect(session.toPrimitives().runCount).toBe(3);
  });

  it("can be restored from primitives via create()", () => {
    const now = new Date();
    const session = Session.create({
      id: "session-2",
      agentId: "agent-2",
      name: "Bug fix",
      status: SessionStatus.COMPLETED,
      startedAt: now,
      completedAt: now,
      totalDurationMs: 3000,
      totalTokensUsed: 800,
      totalCost: 0.15,
      runCount: 2,
      metadata: { key: "val" },
      createdAt: now,
    });

    expect(session.isCompleted).toBe(true);
    expect(session.toPrimitives().runCount).toBe(2);
  });

  it("stores metadata on creation", () => {
    const session = Session.start({
      id: "session-1",
      agentId: "agent-1",
      metadata: { tool: "lint" },
    });

    expect(session.toPrimitives().metadata).toEqual({ tool: "lint" });
  });
});
