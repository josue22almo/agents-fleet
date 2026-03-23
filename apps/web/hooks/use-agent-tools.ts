"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAgentTools(agentId: string) {
  return useQuery({
    queryKey: ["agent-tools", agentId],
    queryFn: () => api.agents.tools(agentId),
    enabled: !!agentId,
  });
}
