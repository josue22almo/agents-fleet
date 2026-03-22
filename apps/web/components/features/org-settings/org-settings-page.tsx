"use client";

import { useOrgSettings } from "@/hooks/use-org-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/form-error";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, UserPlus } from "lucide-react";

export function OrgSettingsPage({ slug }: { slug: string }) {
  const {
    org,
    members,
    isLoading,
    formError,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    invitePending,
    handleInvite,
    handleChangeRole,
    handleRemoveMember,
    handleDeleteOrg,
  } = useOrgSettings(slug);

  if (isLoading) return <Spinner className="mx-auto mt-16" />;
  if (!org) return <p className="text-muted-foreground">Organization not found</p>;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{org.name} Settings</h1>
        <p className="text-muted-foreground mt-1">Manage members and organization details</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        <FormError message={formError} />

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Members</h2>
          <div className="space-y-3">
            {(members ?? []).map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{member.fullName ?? member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {member.isOwner ? (
                    <Badge>Owner</Badge>
                  ) : (
                    <>
                      <Select value={member.isAdmin ? "admin" : "member"} onValueChange={(v) => v && handleChangeRole(member.id, v as "owner" | "admin" | "member")}>
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Invite Member</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="email@example.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v as "admin" | "member")}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={invitePending}>
              <UserPlus className="h-4 w-4 mr-2" />
              {invitePending ? "Inviting..." : "Invite"}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-destructive/30 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete this organization and all its data.
          </p>
          <Button variant="destructive" onClick={handleDeleteOrg}>
            Delete Organization
          </Button>
        </div>
      </div>
    </>
  );
}
