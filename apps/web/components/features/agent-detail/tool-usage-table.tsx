"use client";

import { Wrench } from "lucide-react";
import { useAgentTools } from "@/hooks/use-agent-tools";
import { Spinner } from "@/components/ui/spinner";

export function ToolUsageTable({ agentId }: { agentId: string }) {
  const { data, isLoading } = useAgentTools(agentId);

  if (isLoading) return <Spinner className="mx-auto mt-8" />;

  if (!data || data.tools.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No tool calls recorded yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tool Name</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Calls</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Duration</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Success Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.tools.map((tool) => (
            <tr key={tool.toolName} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4 font-medium">{tool.toolName}</td>
              <td className="py-3 px-4 text-right text-muted-foreground">{tool.calls}</td>
              <td className="py-3 px-4 text-right text-muted-foreground">
                {tool.avgDurationMs > 0 ? `${tool.avgDurationMs}ms` : "--"}
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={
                    tool.successRate >= 0.9
                      ? "text-emerald-600"
                      : tool.successRate >= 0.7
                        ? "text-amber-600"
                        : "text-red-600"
                  }
                >
                  {(tool.successRate * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
