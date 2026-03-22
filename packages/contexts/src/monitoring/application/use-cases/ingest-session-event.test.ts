import { describe, it, expect } from "vitest";
import { SessionStatus } from "../../domain/value-objects/session-status";
import { InMemorySessionRepository } from "../../infrastructure/persistence/in-memory-session-repository";
import { IngestSessionEvent } from "./ingest-session-event";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";

function createDeps() {
  let idCounter = 0;
  const sessionRepo = new InMemorySessionRepository();
  const idGenerator: IdGenerator = {
    generate: () => `sid-${++idCounter}`,
  };
  return { sessionRepo, idGenerator };
}

describe("IngestSessionEvent", () => {
  it("creates a session on session.started", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    const session = await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      data: { name: "Code review" },
    });

    const p = session.toPrimitives();
    expect(p.status).toBe(SessionStatus.ACTIVE);
    expect(p.agentId).toBe("agent-1");
    expect(p.name).toBe("Code review");
  });

  it("creates a session with a given sessionId", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    const session = await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "my-session-id",
    });

    expect(session.id).toBe("my-session-id");
  });

  it("is idempotent for duplicate session.started", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    const s1 = await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "session-1",
    });
    const s2 = await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "session-1",
    });

    expect(s1.id).toBe(s2.id);
  });

  it("completes a session on session.completed", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    const created = await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "session-1",
    });

    const session = await useCase.execute({
      agentId: "agent-1",
      event: "session.completed",
      sessionId: created.id,
      data: { totalDurationMs: 5000, totalTokensUsed: 1000, totalCost: 0.20 },
    });

    const p = session.toPrimitives();
    expect(p.status).toBe(SessionStatus.COMPLETED);
    expect(p.totalDurationMs).toBe(5000);
    expect(p.totalTokensUsed).toBe(1000);
    expect(p.totalCost).toBe(0.20);
  });

  it("is idempotent for duplicate session.completed", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "session-1",
    });

    const s1 = await useCase.execute({
      agentId: "agent-1",
      event: "session.completed",
      sessionId: "session-1",
      data: { totalDurationMs: 5000 },
    });

    const s2 = await useCase.execute({
      agentId: "agent-1",
      event: "session.completed",
      sessionId: "session-1",
      data: { totalDurationMs: 9999 },
    });

    expect(s1.id).toBe(s2.id);
    expect(s2.toPrimitives().totalDurationMs).toBe(5000);
  });

  it("fails a session on session.failed", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "session-1",
    });

    const session = await useCase.execute({
      agentId: "agent-1",
      event: "session.failed",
      sessionId: "session-1",
    });

    expect(session.toPrimitives().status).toBe(SessionStatus.FAILED);
  });

  it("is idempotent for duplicate session.failed", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    await useCase.execute({
      agentId: "agent-1",
      event: "session.started",
      sessionId: "session-1",
    });

    const s1 = await useCase.execute({
      agentId: "agent-1",
      event: "session.failed",
      sessionId: "session-1",
    });

    const s2 = await useCase.execute({
      agentId: "agent-1",
      event: "session.failed",
      sessionId: "session-1",
    });

    expect(s1.id).toBe(s2.id);
  });

  it("throws when completing non-existent session", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    await expect(
      useCase.execute({
        agentId: "agent-1",
        event: "session.completed",
        sessionId: "non-existent",
      }),
    ).rejects.toThrow();
  });

  it("throws when failing non-existent session", async () => {
    const { sessionRepo, idGenerator } = createDeps();
    const useCase = new IngestSessionEvent(sessionRepo, idGenerator);

    await expect(
      useCase.execute({
        agentId: "agent-1",
        event: "session.failed",
        sessionId: "non-existent",
      }),
    ).rejects.toThrow();
  });
});
