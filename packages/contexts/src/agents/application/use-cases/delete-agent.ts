import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { OrganizationNotFoundError } from "../../../iam/domain/errors/organization-not-found.error";
import type { OrganizationRepository } from "../../../iam/ports/repositories/organization-repository";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface DeleteAgentParams {
  agentId: string;
  organizationId: string;
  userId: string;
}

export class DeleteAgent {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly orgRepo: OrganizationRepository,
  ) {}

  async execute(params: DeleteAgentParams): Promise<void> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    if (!org.isMemberOwner(params.userId)) {
      throw new InsufficientPermissionsError("delete agents in this organization");
    }

    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent || !agent.belongsToOrganization(params.organizationId)) {
      throw new AgentNotFoundError(params.agentId);
    }

    agent.softDelete();
    await this.agentRepo.save(agent);
  }
}
