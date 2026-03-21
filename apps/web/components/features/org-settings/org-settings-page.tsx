"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { InviteMemberRequest, ChangeMemberRoleRequest } from "@repo/contracts/iam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/ui/form-error";
import { Trash2, UserPlus } from "lucide-react";

interface MemberItem {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
}

interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export function OrgSettingsPage({ slug }: { slug: string }) {
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetails | null>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<OrgDetails>(`/organizations/${slug}`),
      api.get<MemberItem[]>(`/organizations/${slug}/members`),
    ])
      .then(([orgData, membersData]) => {
        setOrg(orgData);
        setMembers(membersData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setInviting(true);
    try {
      await api.post(`/organizations/${org!.id}/members`, { email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      const updated = await api.get<MemberItem[]>(`/organizations/${slug}/members`);
      setMembers(updated);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      await api.patch(`/organizations/${org!.id}/members/${memberId}`, { role });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to change role");
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await api.delete(`/organizations/${org!.id}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to remove member");
    }
  }

  async function handleDeleteOrg() {
    if (!confirm("Are you sure you want to delete this organization? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/organizations/${slug}`);
      router.push("/organizations");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to delete");
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!org) return <p className="text-muted-foreground">Organization not found</p>;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{org.name} Settings</h1>
        <p className="text-muted-foreground mt-1">Manage members and organization details</p>
      </div>

      <div className="space-y-8 max-w-2xl">
        <FormError message={formError} />

        {/* Members */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Members</h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{member.fullName ?? member.email}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "owner" ? (
                    <Badge>Owner</Badge>
                  ) : (
                    <>
                      <Select value={member.role} onValueChange={(v) => v && handleRoleChange(member.id, v)}>
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

        {/* Invite */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Invite Member</h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="email@example.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={inviting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/30 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete this organization and all its data.
          </p>
          <Button variant="destructive" onClick={handleDeleteOrg} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Organization"}
          </Button>
        </div>
      </div>
    </>
  );
}
