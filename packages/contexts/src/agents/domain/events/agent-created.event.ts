import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class AgentCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = "agents.agent.created";

  constructor(
    readonly agentId: string,
    readonly organizationId: string,
    readonly name: string,
    readonly type: string,
  ) {
    super(AgentCreatedEvent.EVENT_NAME, agentId);
  }
}
