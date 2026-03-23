import type { AgentsContextPort } from "../../_shared/domain/ports/agents-context-port";
import type { AgentRepository } from "../ports/repositories/agent-repository";

export class AgentsContextAdapter implements AgentsContextPort {
  constructor(private readonly agentRepo: AgentRepository) {}

  async getAgentNamesByIds(agentIds: string[]): Promise<Record<string, string>> {
    const names: Record<string, string> = {};
    for (const id of agentIds) {
      const agent = await this.agentRepo.findById(id);
      if (agent) {
        names[id] = agent.toPrimitives().name;
      }
    }
    return names;
  }

  async getAgentIdsForOrganization(organizationId: string): Promise<string[]> {
    const agents = await this.agentRepo.findByOrganizationId(organizationId);
    return agents.map((a) => a.id);
  }
}
