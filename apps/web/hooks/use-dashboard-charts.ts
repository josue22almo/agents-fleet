"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useDashboardCharts(orgId: string) {
  return useQuery({
    queryKey: ["dashboard-charts", orgId],
    queryFn: () => api.agents.dashboardCharts(orgId),
    enabled: !!orgId,
  });
}
