"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RefreshCw, ArrowRight, X, CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SimulationLog } from "@/hooks/use-mcp-simulation";

interface SimulationPanelProps {
  logs: SimulationLog[];
  isRunning: boolean;
  isDone: boolean;
  createdAgentId: string | null;
  onRunAgain: () => void;
  onClose: () => void;
}

function StatusIcon({ status }: { status: SimulationLog["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-amber-400 shrink-0 animate-spin" />;
    case "pending":
      return <Circle className="h-4 w-4 text-gray-500 shrink-0" />;
  }
}

export function SimulationPanel({
  logs,
  isRunning,
  isDone,
  createdAgentId,
  onRunAgain,
  onClose,
}: SimulationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const completedSteps = logs.filter((l) => l.status === "success" || l.status === "error").length;
  const totalSteps = logs.length > 0 ? (logs[0]?.total ?? 0) : 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 shadow-lg mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-sm font-medium text-gray-300">MCP Simulation</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Close simulation panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-900">
        <div
          className="h-full bg-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="p-4 max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
        {logs.map((log) => (
          <div key={log.step} className="flex items-start gap-2">
            <StatusIcon status={log.status} />
            <span className="text-violet-400 shrink-0">[{log.step}/{log.total}]</span>
            <span className="text-gray-200">{log.label}</span>
            {log.durationMs != null && (
              <span className="text-gray-600 shrink-0 ml-auto">{log.durationMs}ms</span>
            )}
          </div>
        ))}
        {logs.some((l) => l.detail) &&
          logs
            .filter((l) => l.detail)
            .map((log) => (
              <div key={`detail-${log.step}`} className="pl-6 text-xs text-gray-500 break-all">
                {log.detail}
              </div>
            ))}
      </div>

      {/* Footer */}
      {isDone && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/50">
          <span className="text-sm text-emerald-400 font-medium">Simulation complete!</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRunAgain}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Run Again
            </Button>
            {createdAgentId && (
              <Link
                href={`/agents/${createdAgentId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-sm font-medium text-violet-400 hover:bg-violet-500/20 transition-colors"
              >
                View Agent
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {isRunning && (
        <div className="flex items-center px-4 py-3 border-t border-gray-800 bg-gray-900/50">
          <Loader2 className="h-4 w-4 text-violet-400 animate-spin mr-2" />
          <span className="text-sm text-gray-400">Running simulation...</span>
        </div>
      )}
    </div>
  );
}
