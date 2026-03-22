"use client";

import Link from "next/link";
import { Plus, Zap } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { useOrgSwitcher } from "@/hooks/use-org-switcher";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

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

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Never connected";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
}

export function AgentsListPage() {
  const { currentOrg } = useOrgSwitcher();
  const { data: agents, isLoading, error, refetch } = useAgents(currentOrg?.id ?? "");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your connected agents</p>
        </div>
        <Link href="/agents/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Connect Agent
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !agents || agents.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-card p-16 text-center shadow-sm">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-1">No agents connected</h3>
          <p className="text-sm text-muted-foreground mb-6">Connect your first agent to start monitoring.</p>
          <Link href="/agents/new" className={buttonVariants()}>Connect Agent</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => {
            const tc = typeColors[agent.type] ?? { bg: "bg-gray-100", text: "text-gray-600" };
            const sc = statusStyles[agent.status] ?? { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
            return (
              <div
                key={agent.id}
                onClick={() => window.location.href = `/agents/${agent.id}`}
                className="block rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg ${tc.bg} ${tc.text} flex items-center justify-center text-lg font-semibold`}>
                      {agent.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold">{agent.name}</h3>
                        <span className={`inline-flex items-center rounded-full ${tc.bg} ${tc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}>
                          {agent.type}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full ${sc.bg} ${sc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {agent.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatLastSeen(agent.lastSeenAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/agents/${agent.id}/settings`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Settings
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
