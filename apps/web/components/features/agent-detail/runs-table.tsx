"use client";

import { Button } from "@/components/ui/button";
import type { PaginatedRunsResponse } from "@repo/contracts/agents";

const statusStyles: Record<string, { bg: string; text: string; dot: string; animate?: boolean }> = {
  running: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", animate: true },
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  failed: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "--";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(cost: number | null): string {
  if (cost === null) return "--";
  return `$${cost.toFixed(4)}`;
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface RunsTableProps {
  data: PaginatedRunsResponse | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function RunsTable({ data, isLoading, page, onPageChange }: RunsTableProps) {
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold">Recent Runs</h2>
      </div>

      {isLoading ? (
        <div className="p-6">
          <p className="text-muted-foreground">Loading runs...</p>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="p-6">
          <p className="text-muted-foreground">No runs recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Run ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Duration</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Tokens</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Cost</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Started</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((run) => {
                  const sc = statusStyles[run.status] ?? { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", animate: true };
                  return (
                    <tr key={run.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                        {run.externalRunId ?? run.id.substring(0, 12)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full ${sc.bg} ${sc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${sc.animate ? "animate-pulse" : ""}`} />
                            {run.status}
                          </span>
                          {run.error && (
                            <p className="text-xs text-red-600 mt-1">{run.error}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDuration(run.durationMs)}</td>
                      <td className="px-6 py-4 text-sm">{run.tokensUsed?.toLocaleString() ?? "--"}</td>
                      <td className="px-6 py-4 text-sm">{formatCost(run.cost)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatTime(run.startedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing page {data.page} of {totalPages} ({data.total} total runs)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
