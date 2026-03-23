"use client";

import Link from "next/link";
import { Zap, Play, Clock, CheckCircle, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useOrgSwitcher } from "@/hooks/use-org-switcher";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useDashboardCharts } from "@/hooks/use-dashboard-charts";
import { useAgentComparison } from "@/hooks/use-agent-comparison";
import { RunDurationHistogram } from "@/components/features/dashboard-charts/run-duration-histogram";
import { TokensByAgentChart } from "@/components/features/dashboard-charts/tokens-by-agent-chart";
import { ErrorBreakdownChart } from "@/components/features/dashboard-charts/error-breakdown-chart";
import { AgentComparisonTable } from "@/components/features/dashboard-comparison/agent-comparison-table";

function formatResponseTime(ms: number): string {
  if (ms === 0) return "\u2014";
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function DashboardPage() {
  const { currentOrg } = useOrgSwitcher();
  const { data: metrics, isLoading } = useDashboardMetrics(currentOrg?.id ?? "");
  const { data: chartData } = useDashboardCharts(currentOrg?.id ?? "");
  const { data: comparisonData } = useAgentComparison(currentOrg?.id ?? "");

  const totalAgents = metrics?.totalAgents ?? 0;
  const activeRuns = metrics?.activeRuns ?? 0;
  const avgResponseTime = metrics ? formatResponseTime(metrics.avgResponseTimeMs) : "\u2014";
  const showEmptyState = !isLoading && totalAgents === 0;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your agents and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
            <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : totalAgents}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalAgents === 0 ? "Connect agents to start" : `${totalAgents} connected`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Runs</p>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Play className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : activeRuns}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeRuns === 0 ? "No active runs" : `${activeRuns} in progress`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : avgResponseTime}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics?.avgResponseTimeMs ? "Across all agents" : "No data yet"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Alarms</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">All clear</p>
        </div>
      </div>

      {showEmptyState && (
        <div className="rounded-xl border border-border border-dashed bg-card p-16 text-center shadow-sm">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No agents connected</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Connect your first agent to start monitoring metrics and performance.
          </p>
          <Link href="/agents/new" className={buttonVariants()}>Connect Agent</Link>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RunDurationHistogram data={chartData?.durationHistogram ?? []} />
        <TokensByAgentChart data={chartData?.tokensByAgent ?? []} />
      </div>

      {/* Error Breakdown + Activity Feed placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ErrorBreakdownChart data={chartData?.errorBreakdown ?? []} />
        {/* Activity feed placeholder */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold">Activity Feed</h3>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
      </div>

      {/* Comparison Table */}
      <AgentComparisonTable data={comparisonData ?? []} />
    </>
  );
}
