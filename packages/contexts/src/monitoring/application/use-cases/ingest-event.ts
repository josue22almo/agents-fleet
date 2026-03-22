import { Run } from "../../domain/entities/run";
import { RunIngestedEvent } from "../../domain/events/run-ingested.event";
import type { RunRepository } from "../../ports/repositories/run-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { EventBus } from "../../../_shared/domain/events/event-bus";

type EventType = "run.started" | "run.completed" | "run.failed";

interface IngestEventParams {
  agentId: string;
  event: EventType;
  externalRunId: string;
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
    private readonly eventBus?: EventBus,
  ) {}

  async execute(params: IngestEventParams): Promise<Run> {
    const existing = await this.runRepo.findByAgentIdAndExternalRunId(
      params.agentId,
      params.externalRunId,
    );

    let run: Run;

    if (params.event === "run.started") {
      run = await this.handleStarted(existing, params);
    } else if (params.event === "run.completed") {
      run = await this.handleCompleted(existing, params);
    } else {
      run = await this.handleFailed(existing, params);
    }

    await this.eventBus?.publish([
      new RunIngestedEvent(run.toPrimitives().id, params.agentId),
    ]);

    return run;
  }

  private async handleStarted(
    existing: Run | null,
    params: IngestEventParams,
  ): Promise<Run> {
    // Idempotent: if a running run already exists for this externalRunId, return it
    if (existing && existing.isRunning) {
      return existing;
    }

    const run = Run.start({
      id: this.idGenerator.generate(),
      agentId: params.agentId,
      externalRunId: params.externalRunId,
      metadata: params.data?.metadata,
    });

    await this.runRepo.save(run);
    return run;
  }

  private async handleCompleted(
    existing: Run | null,
    params: IngestEventParams,
  ): Promise<Run> {
    // Idempotent: if already completed, return as-is
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
    // Idempotent: if already failed, return as-is
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
      metadata: params.data?.metadata,
    });
  }
}
