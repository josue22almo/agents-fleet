"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateAgentRequestSchema } from "@repo/contracts/agents";
import type { AgentWithTokenResponse } from "@repo/contracts/agents";
import { ApiError } from "@/lib/api-client";
import { useCreateAgent } from "@/hooks/use-agents";
import { useOrgSwitcher } from "@/hooks/use-org-switcher";

export function useCreateAgentForm() {
  const router = useRouter();
  const { currentOrg } = useOrgSwitcher();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [createdAgent, setCreatedAgent] = useState<AgentWithTokenResponse | null>(null);
  const createAgent = useCreateAgent();

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");

    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      organizationId: currentOrg?.id ?? "",
    };

    const result = CreateAgentRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    try {
      const agent = await createAgent.mutateAsync(result.data);
      setCreatedAgent(agent);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred",
      );
    }
  }

  return {
    fieldErrors,
    formError,
    isPending: createAgent.isPending,
    createdAgent,
    handleSubmit,
    goBack: () => router.back(),
    goToAgents: () => router.push("/agents"),
  };
}
