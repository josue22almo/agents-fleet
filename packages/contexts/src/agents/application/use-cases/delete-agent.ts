import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface DeleteAgentParams {
  agentId: string;
  userId: string;
}

export class DeleteAgent {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly iam: IAMContextPort,
  ) {}

  async execute(params: DeleteAgentParams): Promise<void> {
    const agent = await this.agentRepo.findById(params.agentId);
    if (!agent) throw new AgentNotFoundError(params.agentId);

    const orgId = agent.toPrimitives().organizationId;
    if (!await this.iam.isUserOwnerOfOrganization(params.userId, orgId)) {
      throw new InsufficientPermissionsError("delete agents in this organization");
    }

    agent.softDelete();
    await this.agentRepo.save(agent);
  }
}
