"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAgentRuns(agentId: string, page: number = 1) {
  return useQuery({
    queryKey: ["agents", agentId, "runs", page],
    queryFn: () => api.agents.runs(agentId, page),
    enabled: !!agentId,
  });
}

export function useAgentMetrics(agentId: string) {
  return useQuery({
    queryKey: ["agents", agentId, "metrics"],
    queryFn: () => api.agents.metrics(agentId),
    enabled: !!agentId,
  });
}
