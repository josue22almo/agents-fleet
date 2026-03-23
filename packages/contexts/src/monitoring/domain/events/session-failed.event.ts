import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class SessionFailedEvent extends DomainEvent {
  static readonly EVENT_NAME = "monitoring.session.failed";

  constructor(
    readonly sessionId: string,
    readonly agentId: string,
  ) {
    super(SessionFailedEvent.EVENT_NAME, sessionId);
  }
}
