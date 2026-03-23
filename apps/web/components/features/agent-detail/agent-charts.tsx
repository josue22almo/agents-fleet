"use client";

import type { DashboardChartDataResponse } from "@repo/contracts/agents";
import { RunDurationHistogram } from "@/components/features/dashboard-charts/run-duration-histogram";
import { ErrorBreakdownChart } from "@/components/features/dashboard-charts/error-breakdown-chart";
import { Spinner } from "@/components/ui/spinner";

interface TopToolsBarProps {
  data: { agentId: string; tokens: number }[];
}

function TopToolsBar({ data }: TopToolsBarProps) {
  const max = Math.max(...data.map((d) => d.tokens), 1);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-1">Top Tools</h3>
      <p className="text-xs text-muted-foreground mb-4">Most used tools</p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.agentId} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12 truncate" title={row.agentId}>
                {row.agentId}
              </span>
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(row.tokens / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right tabular-nums">
                {row.tokens.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AgentChartsProps {
  chartData: DashboardChartDataResponse | undefined;
  isLoading: boolean;
}

export function AgentCharts({ chartData, isLoading }: AgentChartsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!chartData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <RunDurationHistogram data={chartData.durationHistogram} />
      <ErrorBreakdownChart data={chartData.errorBreakdown} />
      <TopToolsBar data={chartData.tokensByAgent} />
    </div>
  );
}
