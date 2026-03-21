"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useOrgSwitcher } from "@/hooks/use-org-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function OrgSwitcher() {
  const { orgs, currentOrg, selectOrg } = useOrgSwitcher();

  const initial = currentOrg?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-between w-full rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {initial}
            </div>
            <span className="font-medium truncate">{currentOrg?.name ?? "Select org"}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {orgs.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => selectOrg(org)}>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {org.name[0]?.toUpperCase()}
              </div>
              <span className="truncate">{org.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/organizations/new" />} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
