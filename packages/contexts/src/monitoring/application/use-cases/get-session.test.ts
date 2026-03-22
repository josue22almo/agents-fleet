import { describe, it, expect } from "vitest";
import { Session } from "../../domain/entities/session";
import { Run } from "../../domain/entities/run";
import { SessionNotFoundError } from "../../domain/errors/session-not-found.error";
import { InMemorySessionRepository } from "../../infrastructure/persistence/in-memory-session-repository";
import { InMemoryRunRepository } from "../../infrastructure/persistence/in-memory-run-repository";
import { GetSession } from "./get-session";

describe("GetSession", () => {
  it("returns a session with its runs", async () => {
    const sessionRepo = new InMemorySessionRepository();
    const runRepo = new InMemoryRunRepository();
    const useCase = new GetSession(sessionRepo, runRepo);

    const session = Session.start({ id: "session-1", agentId: "agent-1" });
    session.addRun();
    await sessionRepo.save(session);

    const run = Run.start({
      id: "run-1",
      agentId: "agent-1",
      externalRunId: "ext-1",
      sessionId: "session-1",
    });
    await runRepo.save(run);

    const result = await useCase.execute("session-1");

    expect(result.session.id).toBe("session-1");
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]!.id).toBe("run-1");
  });

  it("throws SessionNotFoundError for unknown session", async () => {
    const sessionRepo = new InMemorySessionRepository();
    const runRepo = new InMemoryRunRepository();
    const useCase = new GetSession(sessionRepo, runRepo);

    await expect(useCase.execute("unknown")).rejects.toThrow(SessionNotFoundError);
  });
});
