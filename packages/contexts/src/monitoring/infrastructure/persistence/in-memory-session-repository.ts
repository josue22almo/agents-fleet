import type { Session } from "../../domain/entities/session";
import type { SessionRepository } from "../../ports/repositories/session-repository";

export class InMemorySessionRepository implements SessionRepository {
  private sessions: Map<string, Session> = new Map();

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async findByAgentId(
    agentId: string,
    options?: { limit: number; offset: number },
  ): Promise<Session[]> {
    const matching = Array.from(this.sessions.values())
      .filter((s) => s.toPrimitives().agentId === agentId)
      .sort(
        (a, b) =>
          b.toPrimitives().startedAt.getTime() -
          a.toPrimitives().startedAt.getTime(),
      );

    if (options) {
      return matching.slice(options.offset, options.offset + options.limit);
    }
    return matching;
  }

  async countByAgentId(agentId: string): Promise<number> {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.toPrimitives().agentId === agentId) count++;
    }
    return count;
  }

  async save(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}
