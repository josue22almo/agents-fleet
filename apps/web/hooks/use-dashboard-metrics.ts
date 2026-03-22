"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useDashboardMetrics(orgId: string) {
  return useQuery({
    queryKey: ["dashboard-metrics", orgId],
    queryFn: () => api.agents.dashboardMetrics(orgId),
    enabled: !!orgId,
  });
}
