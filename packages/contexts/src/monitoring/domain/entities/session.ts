import { Entity } from "../../../_shared/domain/models/entity";
import { SessionStatus } from "../value-objects/session-status";

export interface SessionPrimitives {
  id: string;
  agentId: string;
  name: string | null;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  totalDurationMs: number | null;
  totalTokensUsed: number | null;
  totalCost: number | null;
  runCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

interface SessionProps {
  id: string;
  agentId: string;
  name: string | null;
  status: SessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  totalDurationMs: number | null;
  totalTokensUsed: number | null;
  totalCost: number | null;
  runCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class Session extends Entity {
  private _agentId: string;
  private _name: string | null;
  private _status: SessionStatus;
  private _startedAt: Date;
  private _completedAt: Date | null;
  private _totalDurationMs: number | null;
  private _totalTokensUsed: number | null;
  private _totalCost: number | null;
  private _runCount: number;
  private _metadata: Record<string, unknown> | null;
  private _createdAt: Date;

  private constructor(props: SessionProps) {
    super(props.id);
    this._agentId = props.agentId;
    this._name = props.name;
    this._status = props.status;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._totalDurationMs = props.totalDurationMs;
    this._totalTokensUsed = props.totalTokensUsed;
    this._totalCost = props.totalCost;
    this._runCount = props.runCount;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt;
  }

  get isActive(): boolean {
    return this._status === SessionStatus.ACTIVE;
  }

  get isCompleted(): boolean {
    return this._status === SessionStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this._status === SessionStatus.FAILED;
  }

  get isFinished(): boolean {
    return this.isCompleted || this.isFailed;
  }

  complete(metrics?: {
    totalDurationMs?: number;
    totalTokensUsed?: number;
    totalCost?: number;
  }): void {
    this._status = SessionStatus.COMPLETED;
    this._completedAt = new Date();
    if (metrics?.totalDurationMs !== undefined) this._totalDurationMs = metrics.totalDurationMs;
    if (metrics?.totalTokensUsed !== undefined) this._totalTokensUsed = metrics.totalTokensUsed;
    if (metrics?.totalCost !== undefined) this._totalCost = metrics.totalCost;
  }

  fail(): void {
    this._status = SessionStatus.FAILED;
    this._completedAt = new Date();
  }

  addRun(): void {
    this._runCount += 1;
  }

  toPrimitives() {
    return {
      id: this.id,
      agentId: this._agentId,
      name: this._name,
      status: this._status,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      totalDurationMs: this._totalDurationMs,
      totalTokensUsed: this._totalTokensUsed,
      totalCost: this._totalCost,
      runCount: this._runCount,
      metadata: this._metadata,
      createdAt: this._createdAt,
    };
  }

  static create(props: SessionProps): Session {
    return new Session(props);
  }

  static start(params: {
    id: string;
    agentId: string;
    name?: string;
    metadata?: Record<string, unknown>;
  }): Session {
    const now = new Date();
    return new Session({
      id: params.id,
      agentId: params.agentId,
      name: params.name ?? null,
      status: SessionStatus.ACTIVE,
      startedAt: now,
      completedAt: null,
      totalDurationMs: null,
      totalTokensUsed: null,
      totalCost: null,
      runCount: 0,
      metadata: params.metadata ?? null,
      createdAt: now,
    });
  }
}
