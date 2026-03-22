interface AgentMetricsProps {
  agentId: string;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  totalCost: number;
  activeRuns: number;
}

export class AgentMetrics {
  private _agentId: string;
  private _totalRuns: number;
  private _successRate: number;
  private _avgDurationMs: number;
  private _totalCost: number;
  private _activeRuns: number;

  private constructor(props: AgentMetricsProps) {
    this._agentId = props.agentId;
    this._totalRuns = props.totalRuns;
    this._successRate = props.successRate;
    this._avgDurationMs = props.avgDurationMs;
    this._totalCost = props.totalCost;
    this._activeRuns = props.activeRuns;
  }

  get hasRuns(): boolean {
    return this._totalRuns > 0;
  }

  get hasActiveRuns(): boolean {
    return this._activeRuns > 0;
  }

  toPrimitives() {
    return {
      agentId: this._agentId,
      totalRuns: this._totalRuns,
      successRate: this._successRate,
      avgDurationMs: this._avgDurationMs,
      totalCost: this._totalCost,
      activeRuns: this._activeRuns,
    };
  }

  static create(props: AgentMetricsProps): AgentMetrics {
    return new AgentMetrics(props);
  }
}
