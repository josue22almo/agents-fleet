"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, ChevronRight, Play, CheckCircle, Clock, DollarSign, Layers, CirclePlay, Wrench } from "lucide-react";
import { useAgent } from "@/hooks/use-agents";
import { useAgentRuns, useAgentMetrics } from "@/hooks/use-agent-runs";
import { useAgentCharts } from "@/hooks/use-agent-charts";
import { buttonVariants } from "@/components/ui/button";
import { RunsTable } from "@/components/features/agent-detail/runs-table";
import { SessionsList } from "@/components/features/agent-detail/sessions-list";
import { AgentCharts } from "@/components/features/agent-detail/agent-charts";
import { AgentUsageStats } from "@/components/features/agent-detail/agent-usage-stats";
import { Spinner } from "@/components/ui/spinner";

const typeColors: Record<string, { bg: string; text: string }> = {
  claude: { bg: "bg-violet-100", text: "text-violet-700" },
  manus: { bg: "bg-blue-100", text: "text-blue-700" },
  custom: { bg: "bg-gray-100", text: "text-gray-600" },
};

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  error: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

type Tab = "sessions" | "runs" | "tools";

export function AgentDetailPage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [runsPage, setRunsPage] = useState(1);
  const { data: agent, isLoading: agentLoading } = useAgent(id);
  const { data: metrics } = useAgentMetrics(id);
  const { data: runsData, isLoading: runsLoading } = useAgentRuns(id, runsPage);
  const { data: chartData, isLoading: chartsLoading } = useAgentCharts(id);

  if (agentLoading) return <Spinner className="mx-auto mt-16" />;
  if (!agent) return <p className="text-muted-foreground">Agent not found</p>;

  const tc = typeColors[agent.type] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  const sc = statusStyles[agent.status] ?? { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Agents
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Detail</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{agent.name}</h1>
            <span className={`inline-flex items-center rounded-full ${tc.bg} ${tc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}>
              {agent.type}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full ${sc.bg} ${sc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {agent.status}
            </span>
          </div>
        </div>
        <Link href={`/agents/${id}/settings`} className={buttonVariants({ variant: "outline" })}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
            <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <Play className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{metrics?.totalRuns.toLocaleString() ?? "--"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{metrics ? `${(metrics.successRate * 100).toFixed(1)}%` : "--"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {metrics ? `${(metrics.avgDurationMs / 1000).toFixed(1)}s` : "--"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{metrics ? `$${metrics.totalCost.toFixed(2)}` : "--"}</p>
        </div>
      </div>

      {/* Charts */}
      <AgentCharts chartData={chartData} isLoading={chartsLoading} />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px transition-colors ${
            activeTab === "sessions"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-gray-300"
          }`}
        >
          <Layers className="h-4 w-4" />
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("runs")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px transition-colors ${
            activeTab === "runs"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-gray-300"
          }`}
        >
          <CirclePlay className="h-4 w-4" />
          Runs
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px transition-colors ${
            activeTab === "tools"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-gray-300"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Tools
        </button>
      </div>

      {activeTab === "sessions" && <SessionsList agentId={id} />}
      {activeTab === "runs" && (
        <RunsTable
          data={runsData}
          isLoading={runsLoading}
          page={runsPage}
          onPageChange={setRunsPage}
        />
      )}
      {activeTab === "tools" && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Tool call tracking coming soon</p>
        </div>
      )}

      {/* Usage Stats */}
      <AgentUsageStats agentId={id} />
    </>
  );
}
