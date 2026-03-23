interface ToolCallSummaryEntryProps {
  toolName: string;
  calls: number;
  avgDurationMs: number;
  successRate: number;
}

interface ToolCallSummaryProps {
  tools: ToolCallSummaryEntryProps[];
  totalCalls: number;
}

export class ToolCallSummary {
  private constructor(private readonly props: ToolCallSummaryProps) {}

  static create(props: ToolCallSummaryProps): ToolCallSummary {
    return new ToolCallSummary(props);
  }

  static empty(): ToolCallSummary {
    return new ToolCallSummary({ tools: [], totalCalls: 0 });
  }

  get hasData(): boolean {
    return this.props.totalCalls > 0;
  }

  toPrimitives() {
    return {
      tools: this.props.tools,
      totalCalls: this.props.totalCalls,
    };
  }
}
