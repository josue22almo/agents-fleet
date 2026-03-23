"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentComparisonResponse } from "@repo/contracts/agents";

type SortKey = "agentId" | "totalRuns" | "successRate" | "avgDurationMs" | "totalTokensUsed" | "totalCost";
type SortDir = "asc" | "desc";

interface Props {
  data: AgentComparisonResponse;
}

function successRateColor(rate: number): string {
  if (rate > 80) return "text-emerald-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-600";
}

function formatDuration(ms: number): string {
  if (ms === 0) return "--";
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function AgentComparisonTable({ data }: Props) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("totalRuns");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " \u2191" : " \u2193") : "");

  const columns: { key: SortKey; label: string }[] = [
    { key: "agentId", label: "Agent" },
    { key: "totalRuns", label: "Total Runs" },
    { key: "successRate", label: "Success Rate" },
    { key: "avgDurationMs", label: "Avg Duration" },
    { key: "totalTokensUsed", label: "Tokens Used" },
    { key: "totalCost", label: "Total Cost" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Agent Comparison</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents to compare</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left py-2 px-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}{arrow(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.agentId}
                  className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/agents/${row.agentId}`)}
                >
                  <td className="py-2 px-3 font-medium truncate max-w-[160px]" title={row.agentName ?? row.agentId}>
                    {row.agentName ?? row.agentId.slice(0, 8) + "..."}
                  </td>
                  <td className="py-2 px-3 tabular-nums">{row.totalRuns}</td>
                  <td className={`py-2 px-3 tabular-nums font-medium ${successRateColor(row.successRate)}`}>
                    {row.successRate.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 tabular-nums">{formatDuration(row.avgDurationMs)}</td>
                  <td className="py-2 px-3 tabular-nums">{row.totalTokensUsed.toLocaleString()}</td>
                  <td className="py-2 px-3 tabular-nums">{formatCost(row.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
