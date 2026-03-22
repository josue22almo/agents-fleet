"use client";

import Link from "next/link";
import { Plus, Building2, User } from "lucide-react";
import { useOrganizations } from "@/hooks/use-organizations";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";

export default function OrganizationsPage() {
  const { data: orgs, isLoading, error, refetch } = useOrganizations();

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">Manage your teams and workspaces</p>
        </div>
        <Link href="/organizations/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
        </Link>
      </div>

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !orgs || orgs.length === 0 ? (
        <div className="rounded-xl border border-border border-dashed bg-card p-16 text-center shadow-sm">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No organizations yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first team organization to collaborate.</p>
          <Link href="/organizations/new" className={buttonVariants()}>Create Organization</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {org.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{org.name}</p>
                    <Badge variant={org.type === "individual" ? "secondary" : "outline"}>
                      {org.type === "individual" ? "Personal" : "Team"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3" />
                    {org.memberCount} {org.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>
              {org.canCurrentUserManage && org.type !== "individual" && (
                <Link href={`/organizations/${org.slug}/settings`} className={buttonVariants({ variant: "outline", size: "sm" })}>Settings</Link>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
