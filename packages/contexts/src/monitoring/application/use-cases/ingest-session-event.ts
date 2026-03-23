import { Session } from "../../domain/entities/session";
import { SessionStartedEvent } from "../../domain/events/session-started.event";
import { SessionCompletedEvent } from "../../domain/events/session-completed.event";
import { SessionFailedEvent } from "../../domain/events/session-failed.event";
import type { SessionRepository } from "../../ports/repositories/session-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { EventBus } from "../../../_shared/domain/events/event-bus";

type SessionEventType = "session.started" | "session.completed" | "session.failed";

interface IngestSessionEventParams {
  agentId: string;
  event: SessionEventType;
  sessionId?: string;
  data?: {
    name?: string;
    totalDurationMs?: number;
    totalTokensUsed?: number;
    totalCost?: number;
    metadata?: Record<string, unknown>;
  };
}

export class IngestSessionEvent {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: IngestSessionEventParams): Promise<Session> {
    if (params.event === "session.started") {
      return this.handleStarted(params);
    }

    if (params.event === "session.completed") {
      return this.handleCompleted(params);
    }

    return this.handleFailed(params);
  }

  private async handleStarted(params: IngestSessionEventParams): Promise<Session> {
    if (params.sessionId) {
      const existing = await this.sessionRepo.findById(params.sessionId);
      if (existing && existing.isActive) {
        return existing;
      }
    }

    const session = Session.start({
      id: params.sessionId ?? this.idGenerator.generate(),
      agentId: params.agentId,
      name: params.data?.name,
      metadata: params.data?.metadata,
    });

    await this.sessionRepo.save(session);
    await this.eventBus.publish([
      new SessionStartedEvent(session.toPrimitives().id, params.agentId),
    ]);
    return session;
  }

  private async handleCompleted(params: IngestSessionEventParams): Promise<Session> {
    if (!params.sessionId) {
      throw new Error("sessionId is required for session.completed");
    }

    const session = await this.sessionRepo.findById(params.sessionId);
    if (!session) {
      throw new Error(`Session "${params.sessionId}" not found`);
    }

    if (session.isCompleted) {
      return session;
    }

    session.complete({
      totalDurationMs: params.data?.totalDurationMs,
      totalTokensUsed: params.data?.totalTokensUsed,
      totalCost: params.data?.totalCost,
    });

    await this.sessionRepo.save(session);
    await this.eventBus.publish([
      new SessionCompletedEvent(session.toPrimitives().id, params.agentId),
    ]);
    return session;
  }

  private async handleFailed(params: IngestSessionEventParams): Promise<Session> {
    if (!params.sessionId) {
      throw new Error("sessionId is required for session.failed");
    }

    const session = await this.sessionRepo.findById(params.sessionId);
    if (!session) {
      throw new Error(`Session "${params.sessionId}" not found`);
    }

    if (session.isFailed) {
      return session;
    }

    session.fail();

    await this.sessionRepo.save(session);
    await this.eventBus.publish([
      new SessionFailedEvent(session.toPrimitives().id, params.agentId),
    ]);
    return session;
  }
}
