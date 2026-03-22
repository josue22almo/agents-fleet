import type { Session } from "../../domain/entities/session";

export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByAgentId(agentId: string, options?: { limit: number; offset: number }): Promise<Session[]>;
  countByAgentId(agentId: string): Promise<number>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
}
