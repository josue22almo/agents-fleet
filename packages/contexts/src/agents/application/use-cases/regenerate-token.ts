import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { Agent } from "../../domain/entities/agent";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { ConnectionToken } from "../../domain/value-objects/connection-token";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface RegenerateTokenParams {
  agentId: string;
  userId: string;
}

interface RegenerateTokenResult {
  agent: Agent;
  token: ConnectionToken;
}

export class RegenerateToken {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly iam: IAMContextPort,
  ) {}

  async execute(params: RegenerateTokenParams): Promise<RegenerateTokenResult> {
    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent) throw new AgentNotFoundError(params.agentId);

    const orgId = agent.toPrimitives().organizationId;
    if (!await this.iam.canUserManageOrganization(params.userId, orgId)) {
      throw new InsufficientPermissionsError("regenerate agent tokens");
    }

    const token = agent.regenerateToken();
    await this.agentRepo.save(agent);

    return { agent, token };
  }
}
