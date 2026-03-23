"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAgentUsage(agentId: string) {
  return useQuery({
    queryKey: ["agent-usage", agentId],
    queryFn: () => api.agents.agentUsage(agentId),
    enabled: !!agentId,
  });
}
