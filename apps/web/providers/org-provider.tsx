"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/hooks/use-organizations";
import type { OrgListItemResponse } from "@repo/contracts/iam";

interface OrgContextType {
  orgs: OrgListItemResponse[];
  currentOrg: OrgListItemResponse | null;
  selectOrg: (org: OrgListItemResponse) => void;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { data: orgs } = useOrganizations();
  const [selected, setSelected] = useState<OrgListItemResponse | null>(null);
  const queryClient = useQueryClient();

  const currentOrg = selected ?? orgs?.[0] ?? null;

  const selectOrg = useCallback(
    (org: OrgListItemResponse) => {
      setSelected(org);
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    [queryClient],
  );

  return (
    <OrgContext.Provider value={{ orgs: orgs ?? [], currentOrg, selectOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useCurrentOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useCurrentOrg must be used within an OrgProvider");
  }
  return context;
}
