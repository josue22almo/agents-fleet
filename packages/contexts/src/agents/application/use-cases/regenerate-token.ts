import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { OrganizationNotFoundError } from "../../../iam/domain/errors/organization-not-found.error";
import type { OrganizationRepository } from "../../../iam/ports/repositories/organization-repository";
import type { Agent } from "../../domain/entities/agent";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { ConnectionToken } from "../../domain/value-objects/connection-token";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface RegenerateTokenParams {
  agentId: string;
  organizationId: string;
  userId: string;
}

interface RegenerateTokenResult {
  agent: Agent;
  token: ConnectionToken;
}

export class RegenerateToken {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly orgRepo: OrganizationRepository,
  ) {}

  async execute(params: RegenerateTokenParams): Promise<RegenerateTokenResult> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    if (!org.canMemberManage(params.userId)) {
      throw new InsufficientPermissionsError("regenerate agent tokens");
    }

    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent || !agent.belongsToOrganization(params.organizationId)) {
      throw new AgentNotFoundError(params.agentId);
    }

    const token = agent.regenerateToken();
    await this.agentRepo.save(agent);

    return { agent, token };
  }
}
