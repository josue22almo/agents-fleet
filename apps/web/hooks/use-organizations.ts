"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreateOrgRequest, UpdateOrgRequest } from "@repo/contracts/iam";

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.organizations.list(),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["organizations", id],
    queryFn: () => api.organizations.get(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrgRequest) => api.organizations.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrgRequest) => api.organizations.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", id] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.organizations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
