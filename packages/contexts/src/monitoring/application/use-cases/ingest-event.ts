import { Run } from "../../domain/entities/run";
import { RunIngestedEvent } from "../../domain/events/run-ingested.event";
import { RunCompletedEvent } from "../../domain/events/run-completed.event";
import { RunFailedEvent } from "../../domain/events/run-failed.event";
import type { RunRepository } from "../../ports/repositories/run-repository";
import type { SessionRepository } from "../../ports/repositories/session-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { EventBus } from "../../../_shared/domain/events/event-bus";

type EventType = "run.started" | "run.completed" | "run.failed";

interface IngestEventParams {
  agentId: string;
  event: EventType;
  externalRunId: string;
  sessionId?: string;
  timestamp?: string;
  data?: {
    durationMs?: number;
    tokensUsed?: number;
    cost?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  };
}

export class IngestEvent {
  constructor(
    private readonly runRepo: RunRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
    private readonly sessionRepo?: SessionRepository,
  ) {}

  async execute(params: IngestEventParams): Promise<Run> {
    const existing = await this.runRepo.findByAgentIdAndExternalRunId(
      params.agentId,
      params.externalRunId,
    );

    let run: Run;

    if (params.event === "run.started") {
      run = await this.handleStarted(existing, params);
      await this.eventBus.publish([
        new RunIngestedEvent(run.toPrimitives().id, params.agentId),
      ]);
    } else if (params.event === "run.completed") {
      run = await this.handleCompleted(existing, params);
      await this.eventBus.publish([
        new RunCompletedEvent(
          run.toPrimitives().id,
          params.agentId,
          params.data?.durationMs ?? 0,
        ),
      ]);
    } else {
      run = await this.handleFailed(existing, params);
      await this.eventBus.publish([
        new RunFailedEvent(
          run.toPrimitives().id,
          params.agentId,
          params.data?.error ?? "Unknown error",
        ),
      ]);
    }

    return run;
  }

  private async handleStarted(
    existing: Run | null,
    params: IngestEventParams,
  ): Promise<Run> {
    if (existing && existing.isRunning) {
      return existing;
    }

    const run = Run.start({
      id: this.idGenerator.generate(),
      agentId: params.agentId,
      externalRunId: params.externalRunId,
      sessionId: params.sessionId,
      metadata: params.data?.metadata,
    });

    await this.runRepo.save(run);

    if (params.sessionId && this.sessionRepo) {
      const session = await this.sessionRepo.findById(params.sessionId);
      if (session) {
        session.addRun();
        await this.sessionRepo.save(session);
      }
    }

    return run;
  }

  private async handleCompleted(
    existing: Run | null,
    params: IngestEventParams,
  ): Promise<Run> {
    if (existing && existing.isCompleted) {
      return existing;
    }

    const run = existing ?? this.createImplicitRun(params);

    run.complete({
      durationMs: params.data?.durationMs,
      tokensUsed: params.data?.tokensUsed,
      cost: params.data?.cost,
      metadata: params.data?.metadata,
    });

    await this.runRepo.save(run);
    return run;
  }

  private async handleFailed(
    existing: Run | null,
    params: IngestEventParams,
  ): Promise<Run> {
    if (existing && existing.isFailed) {
      return existing;
    }

    const run = existing ?? this.createImplicitRun(params);

    run.fail(params.data?.error);

    await this.runRepo.save(run);
    return run;
  }

  private createImplicitRun(params: IngestEventParams): Run {
    return Run.start({
      id: this.idGenerator.generate(),
      agentId: params.agentId,
      externalRunId: params.externalRunId,
      sessionId: params.sessionId,
      metadata: params.data?.metadata,
    });
  }
}
