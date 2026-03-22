import { Entity } from "../../../_shared/domain/models/entity";
import { RunStatus } from "../value-objects/run-status";

export interface RunPrimitives {
  id: string;
  agentId: string;
  externalRunId: string | null;
  sessionId: string | null;
  status: RunStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  tokensUsed: number | null;
  cost: number | null;
  metadata: Record<string, unknown> | null;
  error: string | null;
  createdAt: Date;
}

interface RunProps {
  id: string;
  agentId: string;
  externalRunId: string | null;
  sessionId?: string | null;
  status: RunStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  tokensUsed: number | null;
  cost: number | null;
  metadata: Record<string, unknown> | null;
  error: string | null;
  createdAt: Date;
}

export class Run extends Entity {
  private _agentId: string;
  private _externalRunId: string | null;
  private _sessionId: string | null;
  private _status: RunStatus;
  private _startedAt: Date;
  private _completedAt: Date | null;
  private _durationMs: number | null;
  private _tokensUsed: number | null;
  private _cost: number | null;
  private _metadata: Record<string, unknown> | null;
  private _error: string | null;
  private _createdAt: Date;

  private constructor(props: RunProps) {
    super(props.id);
    this._agentId = props.agentId;
    this._externalRunId = props.externalRunId;
    this._sessionId = props.sessionId ?? null;
    this._status = props.status;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._durationMs = props.durationMs;
    this._tokensUsed = props.tokensUsed;
    this._cost = props.cost;
    this._metadata = props.metadata;
    this._error = props.error;
    this._createdAt = props.createdAt;
  }

  get isRunning(): boolean {
    return this._status === RunStatus.RUNNING;
  }

  get isCompleted(): boolean {
    return this._status === RunStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this._status === RunStatus.FAILED;
  }

  get isFinished(): boolean {
    return this.isCompleted || this.isFailed;
  }

  start(): void {
    this._status = RunStatus.RUNNING;
    this._startedAt = new Date();
  }

  complete(metrics?: {
    durationMs?: number;
    tokensUsed?: number;
    cost?: number;
    metadata?: Record<string, unknown>;
  }): void {
    this._status = RunStatus.COMPLETED;
    this._completedAt = new Date();
    if (metrics?.durationMs !== undefined) this._durationMs = metrics.durationMs;
    if (metrics?.tokensUsed !== undefined) this._tokensUsed = metrics.tokensUsed;
    if (metrics?.cost !== undefined) this._cost = metrics.cost;
    if (metrics?.metadata !== undefined) {
      this._metadata = { ...this._metadata, ...metrics.metadata };
    }
  }

  fail(error?: string): void {
    this._status = RunStatus.FAILED;
    this._completedAt = new Date();
    if (error !== undefined) this._error = error;
  }

  toPrimitives() {
    return {
      id: this.id,
      agentId: this._agentId,
      externalRunId: this._externalRunId,
      sessionId: this._sessionId,
      status: this._status,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      durationMs: this._durationMs,
      tokensUsed: this._tokensUsed,
      cost: this._cost,
      metadata: this._metadata,
      error: this._error,
      createdAt: this._createdAt,
    };
  }

  static create(props: RunProps): Run {
    return new Run(props);
  }

  static start(params: {
    id: string;
    agentId: string;
    externalRunId: string | null;
    sessionId?: string | null;
    metadata?: Record<string, unknown>;
  }): Run {
    const now = new Date();
    return new Run({
      id: params.id,
      agentId: params.agentId,
      externalRunId: params.externalRunId,
      sessionId: params.sessionId ?? null,
      status: RunStatus.RUNNING,
      startedAt: now,
      completedAt: null,
      durationMs: null,
      tokensUsed: null,
      cost: null,
      metadata: params.metadata ?? null,
      error: null,
      createdAt: now,
    });
  }
}
