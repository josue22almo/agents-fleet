import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class SessionCompletedEvent extends DomainEvent {
  static readonly EVENT_NAME = "monitoring.session.completed";

  constructor(
    readonly sessionId: string,
    readonly agentId: string,
  ) {
    super(SessionCompletedEvent.EVENT_NAME, sessionId);
  }
}
