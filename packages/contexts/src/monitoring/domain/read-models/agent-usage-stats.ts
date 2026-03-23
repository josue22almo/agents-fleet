interface PeriodStats {
  period: string;
  runs: number;
  tokens: number;
  cost: number;
  successRate: number;
}

interface AgentUsageStatsProps {
  currentPeriod: PeriodStats;
  history: PeriodStats[];
}

export class AgentUsageStats {
  private constructor(private readonly props: AgentUsageStatsProps) {}

  static create(props: AgentUsageStatsProps): AgentUsageStats {
    return new AgentUsageStats(props);
  }

  get hasUsage(): boolean {
    return this.props.currentPeriod.runs > 0;
  }

  toPrimitives() {
    return {
      currentPeriod: this.props.currentPeriod,
      history: this.props.history,
    };
  }
}
