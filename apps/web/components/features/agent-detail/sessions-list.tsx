"use client";

import { useState } from "react";
import { ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentSessions, useSession } from "@/hooks/use-agent-sessions";
import type { SessionListItemResponse } from "@repo/contracts/agents";

const statusStyles: Record<string, { bg: string; text: string; icon: "check" | "x" | "pulse" }> = {
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", icon: "check" },
  failed: { bg: "bg-red-100", text: "text-red-700", icon: "x" },
  active: { bg: "bg-blue-100", text: "text-blue-700", icon: "pulse" },
};

const runStatusStyles: Record<string, { bg: string; text: string; dot: string; animate?: boolean }> = {
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
  return `$${cost.toFixed(2)}`;
}

function formatRunCost(cost: number | null): string {
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

function SessionStatusIcon({ status }: { status: string }) {
  const style = statusStyles[status];
  if (!style) return null;

  if (style.icon === "check") return <Check className="h-3 w-3" />;
  if (style.icon === "x") return <X className="h-3 w-3" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />;
}

function SessionCard({ session, agentId }: { session: SessionListItemResponse; agentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: sessionDetail, isLoading: detailLoading } = useSession(
    agentId,
    expanded ? session.id : "",
  );

  const sc = statusStyles[session.status] ?? statusStyles.active!;

  return (
    <div
      className={`rounded-xl border ${expanded ? "border-primary/30" : "border-border"} bg-card shadow-sm overflow-hidden`}
    >
      <div
        className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">
                  {session.name ?? `Session ${session.id.substring(0, 8)}`}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full ${sc.bg} ${sc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}
                >
                  <SessionStatusIcon status={session.status} />
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Session ID: {session.id.substring(0, 16)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Runs</p>
              <p className="font-medium">{session.runCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className={`font-medium ${session.status === "active" ? "text-blue-600" : ""}`}>
                {session.status === "active" ? "running" : formatDuration(session.totalDurationMs)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="font-medium">{formatCost(session.totalCost)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="font-medium text-muted-foreground">{formatTime(session.startedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20">
          <div className="px-5 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 pl-9">
              Session Runs
            </p>
          </div>
          {detailLoading ? (
            <div className="px-5 pb-4">
              <p className="text-sm text-muted-foreground pl-9">Loading runs...</p>
            </div>
          ) : !sessionDetail || sessionDetail.runs.length === 0 ? (
            <div className="px-5 pb-4">
              <p className="text-sm text-muted-foreground pl-9">No runs in this session.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2 pl-14">
                      Run ID
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2">
                      Duration
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2">
                      Tokens
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2">
                      Cost
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-2">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessionDetail.runs.map((run) => {
                    const rsc = runStatusStyles[run.status] ?? {
                      bg: "bg-blue-100",
                      text: "text-blue-700",
                      dot: "bg-blue-500",
                      animate: true,
                    };
                    return (
                      <tr
                        key={run.id}
                        className="border-t border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3 pl-14 text-sm font-mono text-muted-foreground">
                          {run.externalRunId ?? run.id.substring(0, 12)}
                        </td>
                        <td className="px-6 py-3">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full ${rsc.bg} ${rsc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${rsc.dot} ${rsc.animate ? "animate-pulse" : ""}`}
                              />
                              {run.status}
                            </span>
                            {run.error && (
                              <p className="text-xs text-red-600 mt-1">{run.error}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm">{formatDuration(run.durationMs)}</td>
                        <td className="px-6 py-3 text-sm">
                          {run.tokensUsed?.toLocaleString() ?? "--"}
                        </td>
                        <td className="px-6 py-3 text-sm">{formatRunCost(run.cost)}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          {formatTime(run.startedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SessionsListProps {
  agentId: string;
}

export function SessionsList({ agentId }: SessionsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAgentSessions(agentId, page);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">No sessions recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {data.data.map((session) => (
          <SessionCard key={session.id} session={session} agentId={agentId} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Showing page {data.page} of {totalPages} ({data.total} total sessions)
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
