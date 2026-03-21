"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useInvitation(token: string) {
  return useQuery({
    queryKey: ["invitations", token],
    queryFn: () => api.invitations.get(token),
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (token: string) => api.invitations.accept(token),
  });
}

export function useDeclineInvitation() {
  return useMutation({
    mutationFn: (token: string) => api.invitations.decline(token),
  });
}
