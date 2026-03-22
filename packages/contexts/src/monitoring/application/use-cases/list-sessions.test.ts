import { describe, it, expect } from "vitest";
import { Session } from "../../domain/entities/session";
import { InMemorySessionRepository } from "../../infrastructure/persistence/in-memory-session-repository";
import { ListSessions } from "./list-sessions";

describe("ListSessions", () => {
  it("returns paginated sessions for an agent", async () => {
    const sessionRepo = new InMemorySessionRepository();
    const useCase = new ListSessions(sessionRepo);

    for (let i = 0; i < 5; i++) {
      await sessionRepo.save(
        Session.start({ id: `s-${i}`, agentId: "agent-1", name: `Session ${i}` }),
      );
    }

    const result = await useCase.execute({ agentId: "agent-1", page: 1, pageSize: 3 });

    expect(result.sessions).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(3);
  });

  it("returns empty list for unknown agent", async () => {
    const sessionRepo = new InMemorySessionRepository();
    const useCase = new ListSessions(sessionRepo);

    const result = await useCase.execute({ agentId: "unknown" });

    expect(result.sessions).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
