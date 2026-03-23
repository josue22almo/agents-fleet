import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class SessionStartedEvent extends DomainEvent {
  static readonly EVENT_NAME = "monitoring.session.started";

  constructor(
    readonly sessionId: string,
    readonly agentId: string,
  ) {
    super(SessionStartedEvent.EVENT_NAME, sessionId);
  }
}
