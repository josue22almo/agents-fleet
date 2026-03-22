import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class RunIngestedEvent extends DomainEvent {
  static readonly EVENT_NAME = "monitoring.run.ingested";

  constructor(
    readonly runId: string,
    readonly agentId: string,
  ) {
    super(RunIngestedEvent.EVENT_NAME, runId);
  }
}
