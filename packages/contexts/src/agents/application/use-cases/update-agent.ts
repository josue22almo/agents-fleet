import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { OrganizationNotFoundError } from "../../../iam/domain/errors/organization-not-found.error";
import type { OrganizationRepository } from "../../../iam/ports/repositories/organization-repository";
import type { Agent } from "../../domain/entities/agent";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface UpdateAgentParams {
  agentId: string;
  name: string;
  organizationId: string;
  userId: string;
}

export class UpdateAgent {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly orgRepo: OrganizationRepository,
  ) {}

  async execute(params: UpdateAgentParams): Promise<Agent> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    if (!org.canMemberManage(params.userId)) {
      throw new InsufficientPermissionsError("update agents in this organization");
    }

    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent || !agent.belongsToOrganization(params.organizationId)) {
      throw new AgentNotFoundError(params.agentId);
    }

    agent.updateName(params.name);
    await this.agentRepo.save(agent);

    return agent;
  }
}
