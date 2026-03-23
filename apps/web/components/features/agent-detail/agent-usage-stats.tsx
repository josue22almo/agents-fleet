"use client";

import { useAgentUsage } from "@/hooks/use-agent-usage-stats";
import { Spinner } from "@/components/ui/spinner";

interface AgentUsageStatsProps {
  agentId: string;
}

export function AgentUsageStats({ agentId }: AgentUsageStatsProps) {
  const { data, isLoading } = useAgentUsage(agentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!data) return null;

  const { currentPeriod, history } = data;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm mt-6">
      <div className="p-6">
        <h3 className="text-sm font-semibold mb-1">Usage</h3>
        <p className="text-xs text-muted-foreground mb-4">Current period and history for this agent</p>

        {/* Current Period */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tokens ({currentPeriod.period})</p>
            <p className="text-xl font-bold">{currentPeriod.tokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cost ({currentPeriod.period})</p>
            <p className="text-xl font-bold">${currentPeriod.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Runs ({currentPeriod.period})</p>
            <p className="text-xl font-bold">{currentPeriod.runs.toLocaleString()}</p>
          </div>
        </div>

        {/* History Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Period</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Runs</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Tokens</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Cost</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr
                key={row.period}
                className={i < history.length - 1 ? "border-b border-border/50" : ""}
              >
                <td className="py-2.5 px-2 font-medium">{row.period}</td>
                <td className="text-right py-2.5 px-2">{row.runs.toLocaleString()}</td>
                <td className="text-right py-2.5 px-2">{row.tokens.toLocaleString()}</td>
                <td className="text-right py-2.5 px-2">${row.cost.toFixed(2)}</td>
                <td className="text-right py-2.5 px-2 text-emerald-600">
                  {(row.successRate * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
