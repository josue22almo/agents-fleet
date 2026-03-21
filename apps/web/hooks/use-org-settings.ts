"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationBySlug, useDeleteOrganization } from "@/hooks/use-organizations";
import { useMembers, useInviteMember, useChangeMemberRole, useRemoveMember } from "@/hooks/use-members";
import { ApiError } from "@/lib/api-client";

export function useOrgSettings(slug: string) {
  const router = useRouter();
  const { data: org, isLoading: orgLoading } = useOrganizationBySlug(slug);
  const { data: members, isLoading: membersLoading } = useMembers(org?.id ?? "");
  const inviteMember = useInviteMember(org?.id ?? "");
  const changeMemberRole = useChangeMemberRole(org?.id ?? "");
  const removeMember = useRemoveMember(org?.id ?? "");
  const deleteOrg = useDeleteOrganization();

  const [formError, setFormError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  async function handleInvite() {
    if (!org || !inviteEmail) return;
    setFormError("");
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setInviteRole("member");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to invite member");
    }
  }

  async function handleChangeRole(memberId: string, role: "owner" | "admin" | "member") {
    await changeMemberRole.mutateAsync({ memberId, data: { role } });
  }

  async function handleRemoveMember(memberId: string) {
    await removeMember.mutateAsync(memberId);
  }

  async function handleDeleteOrg() {
    if (!org) return;
    await deleteOrg.mutateAsync(org.id);
    router.push("/organizations");
  }

  return {
    org,
    members,
    isLoading: orgLoading || membersLoading,
    formError,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    invitePending: inviteMember.isPending,
    handleInvite,
    handleChangeRole,
    handleRemoveMember,
    handleDeleteOrg,
  };
}
