interface DurationBucket {
  bucket: string;
  count: number;
}

interface TokensByAgent {
  agentId: string;
  agentName?: string;
  tokens: number;
}

interface ErrorBreakdown {
  type: string;
  count: number;
}

interface DashboardChartDataProps {
  durationHistogram: DurationBucket[];
  tokensByAgent: TokensByAgent[];
  errorBreakdown: ErrorBreakdown[];
}

export class DashboardChartData {
  private constructor(private readonly props: DashboardChartDataProps) {}

  static create(props: DashboardChartDataProps): DashboardChartData {
    return new DashboardChartData(props);
  }

  static empty(): DashboardChartData {
    return new DashboardChartData({
      durationHistogram: [],
      tokensByAgent: [],
      errorBreakdown: [],
    });
  }

  get hasData(): boolean {
    return this.props.durationHistogram.length > 0
      || this.props.tokensByAgent.length > 0
      || this.props.errorBreakdown.length > 0;
  }

  toPrimitives() {
    return {
      durationHistogram: this.props.durationHistogram,
      tokensByAgent: this.props.tokensByAgent,
      errorBreakdown: this.props.errorBreakdown,
    };
  }
}
