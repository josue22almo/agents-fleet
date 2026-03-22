import { Run } from "../../domain/entities/run";
import type { RunRepository } from "../../ports/repositories/run-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";

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
  ) {}

  async execute(params: IngestEventParams): Promise<Run> {
    const existing = await this.runRepo.findByAgentIdAndExternalRunId(
      params.agentId,
      params.externalRunId,
    );

    if (params.event === "run.started") {
      return this.handleStarted(existing, params);
    }

    if (params.event === "run.completed") {
      return this.handleCompleted(existing, params);
    }

    return this.handleFailed(existing, params);
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
