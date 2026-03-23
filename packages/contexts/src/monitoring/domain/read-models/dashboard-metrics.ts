interface DashboardMetricsProps {
  totalAgents: number;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  avgResponseTimeMs: number;
  totalCost: number;
  activeRuns: number;
}

export class DashboardMetrics {
  private constructor(private readonly props: DashboardMetricsProps) {}

  static create(props: DashboardMetricsProps): DashboardMetrics {
    return new DashboardMetrics(props);
  }

  static empty(): DashboardMetrics {
    return new DashboardMetrics({
      totalAgents: 0,
      totalRuns: 0,
      successRate: 0,
      avgDurationMs: 0,
      avgResponseTimeMs: 0,
      totalCost: 0,
      activeRuns: 0,
    });
  }

  get hasAgents(): boolean {
    return this.props.totalAgents > 0;
  }

  toPrimitives() {
    return { ...this.props };
  }
}
