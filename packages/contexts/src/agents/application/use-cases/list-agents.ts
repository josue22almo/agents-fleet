import type { Agent } from "../../domain/entities/agent";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

export class ListAgents {
  constructor(private readonly agentRepo: AgentRepository) {}

  async execute(organizationId: string): Promise<Agent[]> {
    return this.agentRepo.findByOrganizationId(organizationId);
  }
}
