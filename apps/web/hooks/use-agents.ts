"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreateAgentRequest, UpdateAgentRequest } from "@repo/contracts/agents";

export function useAgents(orgId: string) {
  return useQuery({
    queryKey: ["agents", orgId],
    queryFn: () => api.agents.list(orgId),
    enabled: !!orgId,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agents", "detail", id],
    queryFn: () => api.agents.get(id),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgentRequest) => api.agents.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAgentRequest) => api.agents.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agents", "detail", id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.agents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useRegenerateToken(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.agents.regenerateToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "detail", id] });
    },
  });
}
