import type { EventBus } from "../../../_shared/domain/events/event-bus";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { OrganizationRepository } from "../../../iam/ports/repositories/organization-repository";
import { Agent } from "../../domain/entities/agent";
import { AgentNotFoundError } from "../../domain/errors/agent-not-found.error";
import { AgentCreatedEvent } from "../../domain/events/agent-created.event";
import type { AgentType } from "../../domain/value-objects/agent-type";
import type { ConnectionToken } from "../../domain/value-objects/connection-token";
import type { AgentRepository } from "../../ports/repositories/agent-repository";
import { InsufficientPermissionsError } from "../../../iam/domain/errors/insufficient-permissions.error";
import { OrganizationNotFoundError } from "../../../iam/domain/errors/organization-not-found.error";

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
    private readonly orgRepo: OrganizationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: CreateAgentParams): Promise<CreateAgentResult> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    if (!org.canMemberManage(params.userId)) {
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
