import { Session } from "../../domain/entities/session";
import type { SessionRepository } from "../../ports/repositories/session-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";

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
    // If a sessionId is provided and it already exists as active, return idempotently
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

    // Idempotent
    if (session.isCompleted) {
      return session;
    }

    session.complete({
      totalDurationMs: params.data?.totalDurationMs,
      totalTokensUsed: params.data?.totalTokensUsed,
      totalCost: params.data?.totalCost,
    });

    await this.sessionRepo.save(session);
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

    // Idempotent
    if (session.isFailed) {
      return session;
    }

    session.fail();

    await this.sessionRepo.save(session);
    return session;
  }
}
