import type { Agent } from "../../domain/entities/agent";

export interface AgentRepository {
  findById(id: string): Promise<Agent | null>;
  findByOrganizationId(orgId: string): Promise<Agent[]>;
  findByTokenHash(tokenHash: string): Promise<Agent | null>;
  save(agent: Agent): Promise<void>;
  delete(id: string): Promise<void>;
}
