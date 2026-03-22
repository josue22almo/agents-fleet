"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CreateOrgRequest, UpdateOrgRequest } from "@repo/contracts/iam";

export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.organizations.list(),
    enabled,
  });
}

export function useOrganizationBySlug(slug: string) {
  return useQuery({
    queryKey: ["organizations", slug],
    queryFn: () => api.organizations.get(slug),
    enabled: !!slug,
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
