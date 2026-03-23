interface AgentComparisonEntryProps {
  agentId: string;
  agentName?: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs: number;
  totalTokensUsed: number;
  totalCost: number;
}

export class AgentComparisonEntry {
  private constructor(private readonly props: AgentComparisonEntryProps) {}

  static create(props: AgentComparisonEntryProps): AgentComparisonEntry {
    return new AgentComparisonEntry(props);
  }

  get isHealthy(): boolean {
    return this.props.successRate >= 80;
  }

  get isWarning(): boolean {
    return this.props.successRate >= 50 && this.props.successRate < 80;
  }

  toPrimitives() {
    return { ...this.props };
  }
}
