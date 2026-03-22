import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class RunFailedEvent extends DomainEvent {
  static readonly EVENT_NAME = "monitoring.run.failed";

  constructor(
    readonly runId: string,
    readonly agentId: string,
    readonly error: string | null,
  ) {
    super(RunFailedEvent.EVENT_NAME, runId);
  }
}
