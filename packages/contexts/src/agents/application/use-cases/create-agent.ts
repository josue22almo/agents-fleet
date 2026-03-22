import type { EventBus } from "../../../_shared/domain/events/event-bus";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import { Agent } from "../../domain/entities/agent";
import { AgentCreatedEvent } from "../../domain/events/agent-created.event";
import type { AgentType } from "../../domain/value-objects/agent-type";
import type { ConnectionToken } from "../../domain/value-objects/connection-token";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface CreateAgentParams {
  name: string;
  type: AgentType;
  organizationId: string;
  userId: string;
}

interface CreateAgentResult {
  agent: Agent;
  token: ConnectionToken;
}

export class CreateAgent {
  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly iam: IAMContextPort,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: CreateAgentParams): Promise<CreateAgentResult> {
    if (!await this.iam.canUserManageOrganization(params.userId, params.organizationId)) {
      throw new InsufficientPermissionsError("create agents in this organization");
    }

    const { agent, token } = Agent.createNew({
      id: this.idGenerator.generate(),
      organizationId: params.organizationId,
      name: params.name,
      type: params.type,
      createdBy: params.userId,
    });

    await this.agentRepo.save(agent);

    await this.eventBus.publish([
      new AgentCreatedEvent(agent.id, params.organizationId, params.name, params.type),
    ]);

    return { agent, token };
  }
}
