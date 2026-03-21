"use client";

import { useState } from "react";
import { useOrganizations } from "@/hooks/use-organizations";
import type { OrgListItemResponse } from "@repo/contracts/iam";

export function useOrgSwitcher() {
  const { data: orgs } = useOrganizations();
  const [selected, setSelected] = useState<OrgListItemResponse | null>(null);

  const currentOrg = selected ?? orgs?.[0] ?? null;

  return {
    orgs: orgs ?? [],
    currentOrg,
    selectOrg: setSelected,
  };
}
