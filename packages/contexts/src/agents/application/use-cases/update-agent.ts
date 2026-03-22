import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { Agent } from "../../domain/entities/agent";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface UpdateAgentParams {
  agentId: string;
  name: string;
  userId: string;
}

export class UpdateAgent {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly iam: IAMContextPort,
  ) {}

  async execute(params: UpdateAgentParams): Promise<Agent> {
    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent) throw new AgentNotFoundError(params.agentId);

    const orgId = agent.toPrimitives().organizationId;
    if (!await this.iam.canUserManageOrganization(params.userId, orgId)) {
      throw new InsufficientPermissionsError("update agents in this organization");
    }

    agent.updateName(params.name);
    await this.agentRepo.save(agent);

    return agent;
  }
}
