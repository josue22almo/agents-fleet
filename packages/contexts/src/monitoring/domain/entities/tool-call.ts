import { Entity } from "../../../_shared/domain/models/entity";

export interface ToolCallPrimitives {
  id: string;
  runId: string;
  agentId: string;
  toolName: string;
  durationMs: number | null;
  success: boolean;
  timestamp: Date;
  createdAt: Date;
}

interface ToolCallProps {
  id: string;
  runId: string;
  agentId: string;
  toolName: string;
  durationMs: number | null;
  success: boolean;
  timestamp: Date;
  createdAt: Date;
}

export class ToolCall extends Entity {
  private _runId: string;
  private _agentId: string;
  private _toolName: string;
  private _durationMs: number | null;
  private _success: boolean;
  private _timestamp: Date;
  private _createdAt: Date;

  private constructor(props: ToolCallProps) {
    super(props.id);
    this._runId = props.runId;
    this._agentId = props.agentId;
    this._toolName = props.toolName;
    this._durationMs = props.durationMs;
    this._success = props.success;
    this._timestamp = props.timestamp;
    this._createdAt = props.createdAt;
  }

  toPrimitives() {
    return {
      id: this.id,
      runId: this._runId,
      agentId: this._agentId,
      toolName: this._toolName,
      durationMs: this._durationMs,
      success: this._success,
      timestamp: this._timestamp,
      createdAt: this._createdAt,
    };
  }

  static create(props: ToolCallProps): ToolCall {
    return new ToolCall(props);
  }

  static record(params: {
    id: string;
    runId: string;
    agentId: string;
    toolName: string;
    durationMs?: number;
    success?: boolean;
  }): ToolCall {
    const now = new Date();
    return new ToolCall({
      id: params.id,
      runId: params.runId,
      agentId: params.agentId,
      toolName: params.toolName,
      durationMs: params.durationMs ?? null,
      success: params.success ?? true,
      timestamp: now,
      createdAt: now,
    });
  }
}
