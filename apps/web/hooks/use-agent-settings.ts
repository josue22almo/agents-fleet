"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAgent, useUpdateAgent, useDeleteAgent, useRegenerateToken } from "@/hooks/use-agents";
import { ApiError } from "@/lib/api-client";
import type { AgentWithTokenResponse } from "@repo/contracts/agents";

export function useAgentSettings(id: string) {
  const router = useRouter();
  const { data: agent, isLoading } = useAgent(id);
  const updateAgent = useUpdateAgent(id);
  const deleteAgent = useDeleteAgent();
  const regenerateToken = useRegenerateToken(id);

  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [regeneratedToken, setRegeneratedToken] = useState<AgentWithTokenResponse | null>(null);

  if (agent && !nameInitialized) {
    setName(agent.name);
    setNameInitialized(true);
  }

  async function handleSave() {
    setFormError("");
    try {
      await updateAgent.mutateAsync({ name });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Failed to update agent",
      );
    }
  }

  async function handleRegenerateToken() {
    setFormError("");
    try {
      const result = await regenerateToken.mutateAsync();
      setRegeneratedToken(result);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Failed to regenerate token",
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteAgent.mutateAsync(id);
      router.push("/agents");
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Failed to delete agent",
      );
    }
  }

  return {
    agent,
    isLoading,
    formError,
    name,
    setName,
    savePending: updateAgent.isPending,
    regeneratePending: regenerateToken.isPending,
    deletePending: deleteAgent.isPending,
    regeneratedToken,
    handleSave,
    handleRegenerateToken,
    handleDelete,
  };
}
