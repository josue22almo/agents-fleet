import type { Agent } from "../../domain/entities/agent";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

export class InMemoryAgentRepository implements AgentRepository {
  private agents: Map<string, Agent> = new Map();

  async findById(id: string): Promise<Agent | null> {
    const agent = this.agents.get(id) ?? null;
    if (agent && agent.isDeleted) return null;
    return agent;
  }

  async findByOrganizationId(orgId: string): Promise<Agent[]> {
    const results: Agent[] = [];
    for (const agent of this.agents.values()) {
      if (agent.isDeleted) continue;
      if (agent.belongsToOrganization(orgId)) {
        results.push(agent);
      }
    }
    return results;
  }

  async findByTokenHash(tokenHash: string): Promise<Agent | null> {
    for (const agent of this.agents.values()) {
      if (agent.isDeleted) continue;
      const primitives = agent.toPrimitives();
      if (primitives.tokenHash === tokenHash) return agent;
    }
    return null;
  }

  async save(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
  }

  async delete(id: string): Promise<void> {
    this.agents.delete(id);
  }
}
