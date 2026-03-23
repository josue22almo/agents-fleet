import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventHandler, type DomainEvent } from "@repo/contexts/_shared";
import {
  RunIngestedEvent,
  RunCompletedEvent,
  RunFailedEvent,
  SessionStartedEvent,
  SessionCompletedEvent,
  SessionFailedEvent,
} from "@repo/contexts/monitoring";

interface ActivityPayload {
  agentId: string;
  type: string;
  detail?: string;
  timestamp: string;
}

abstract class ActivityBridgeHandler<T extends DomainEvent> extends EventHandler<T> {
  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  protected emitActivity(payload: Omit<ActivityPayload, "timestamp">) {
    this.emitter.emit("activity", {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}

export class OnRunIngestedEmitActivity extends ActivityBridgeHandler<RunIngestedEvent> {
  readonly eventName = RunIngestedEvent.EVENT_NAME;

  async handle(event: RunIngestedEvent) {
    this.emitActivity({ agentId: event.agentId, type: "run.started" });
  }
}

export class OnRunCompletedEmitActivity extends ActivityBridgeHandler<RunCompletedEvent> {
  readonly eventName = RunCompletedEvent.EVENT_NAME;

  async handle(event: RunCompletedEvent) {
    this.emitActivity({
      agentId: event.agentId,
      type: "run.completed",
      detail: `${event.durationMs}ms`,
    });
  }
}

export class OnRunFailedEmitActivity extends ActivityBridgeHandler<RunFailedEvent> {
  readonly eventName = RunFailedEvent.EVENT_NAME;

  async handle(event: RunFailedEvent) {
    this.emitActivity({
      agentId: event.agentId,
      type: "run.failed",
      detail: event.error ?? undefined,
    });
  }
}

export class OnSessionStartedEmitActivity extends ActivityBridgeHandler<SessionStartedEvent> {
  readonly eventName = SessionStartedEvent.EVENT_NAME;

  async handle(event: SessionStartedEvent) {
    this.emitActivity({ agentId: event.agentId, type: "session.started" });
  }
}

export class OnSessionCompletedEmitActivity extends ActivityBridgeHandler<SessionCompletedEvent> {
  readonly eventName = SessionCompletedEvent.EVENT_NAME;

  async handle(event: SessionCompletedEvent) {
    this.emitActivity({ agentId: event.agentId, type: "session.completed" });
  }
}

export class OnSessionFailedEmitActivity extends ActivityBridgeHandler<SessionFailedEvent> {
  readonly eventName = SessionFailedEvent.EVENT_NAME;

  async handle(event: SessionFailedEvent) {
    this.emitActivity({ agentId: event.agentId, type: "session.failed" });
  }
}
