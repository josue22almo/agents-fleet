"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAgentCharts(agentId: string) {
  return useQuery({
    queryKey: ["agent-charts", agentId],
    queryFn: () => api.agents.agentCharts(agentId),
    enabled: !!agentId,
  });
}
