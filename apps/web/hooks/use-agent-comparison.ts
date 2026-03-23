"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAgentComparison(orgId: string) {
  return useQuery({
    queryKey: ["dashboard-comparison", orgId],
    queryFn: () => api.agents.dashboardComparison(orgId),
    enabled: !!orgId,
  });
}
