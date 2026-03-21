"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { InviteMemberRequest, ChangeMemberRoleRequest } from "@repo/contracts/iam";

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: ["members", orgId],
    queryFn: () => api.members.list(orgId),
    enabled: !!orgId,
  });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberRequest) => api.members.invite(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useChangeMemberRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: ChangeMemberRoleRequest }) =>
      api.members.changeRole(orgId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => api.members.remove(orgId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}
