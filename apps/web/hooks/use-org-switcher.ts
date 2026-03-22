"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/hooks/use-organizations";
import type { OrgListItemResponse } from "@repo/contracts/iam";

export function useOrgSwitcher() {
  const { data: orgs } = useOrganizations();
  const [selected, setSelected] = useState<OrgListItemResponse | null>(null);
  const queryClient = useQueryClient();

  const currentOrg = selected ?? orgs?.[0] ?? null;

  function selectOrg(org: OrgListItemResponse) {
    setSelected(org);
    // Invalidate org-scoped queries when switching
    queryClient.invalidateQueries({ queryKey: ["agents"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["members"] });
  }

  return {
    orgs: orgs ?? [],
    currentOrg,
    selectOrg,
  };
}
