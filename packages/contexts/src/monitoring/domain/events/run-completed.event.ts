import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class RunCompletedEvent extends DomainEvent {
  static readonly EVENT_NAME = "monitoring.run.completed";

  constructor(
    readonly runId: string,
    readonly agentId: string,
    readonly durationMs: number | null,
  ) {
    super(RunCompletedEvent.EVENT_NAME, runId);
  }
}
