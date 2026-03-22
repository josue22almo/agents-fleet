"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useAgentSessions(agentId: string, page: number = 1) {
  return useQuery({
    queryKey: ["agents", agentId, "sessions", page],
    queryFn: () => api.agents.sessions(agentId, page),
    enabled: !!agentId,
  });
}

export function useSession(agentId: string, sessionId: string) {
  return useQuery({
    queryKey: ["agents", agentId, "sessions", sessionId],
    queryFn: () => api.agents.session(agentId, sessionId),
    enabled: !!agentId && !!sessionId,
  });
}
