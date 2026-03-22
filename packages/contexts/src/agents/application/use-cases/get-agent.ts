import type { Agent } from "../../domain/entities/agent";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface GetAgentParams {
  agentId: string;
  organizationId: string;
}

export class GetAgent {
  constructor(private readonly agentRepo: AgentRepository) {}

  async execute(params: GetAgentParams): Promise<Agent> {
    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent || !agent.belongsToOrganization(params.organizationId)) {
      throw new AgentNotFoundError(params.agentId);
    }
    return agent;
  }
}
