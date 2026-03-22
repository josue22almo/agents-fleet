"use client";

import Link from "next/link";
import { ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useAgentSettings } from "@/hooks/use-agent-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { Spinner } from "@/components/ui/spinner";
import { TokenDisplay } from "@/components/features/connect-agent/token-display";

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  error: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Never";
  return new Date(lastSeenAt).toLocaleString();
}

export function AgentSettingsPage({ id }: { id: string }) {
  const {
    agent,
    isLoading,
    formError,
    name,
    setName,
    savePending,
    regeneratePending,
    deletePending,
    regeneratedToken,
    handleSave,
    handleRegenerateToken,
    handleDelete,
  } = useAgentSettings(id);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  if (isLoading) return <Spinner className="mx-auto mt-16" />;
  if (!agent) return <p className="text-muted-foreground">Agent not found</p>;

  const sc = statusStyles[agent.status] ?? { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };

  async function copyPrefix() {
    await navigator.clipboard.writeText(agent!.tokenPrefix);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Agents
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link href={`/agents/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {agent.name}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Settings</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Agent Settings</h1>
        <p className="text-muted-foreground mt-1">{agent.name}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <FormError message={formError} />

        {/* General Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex h-10 w-full items-center rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground capitalize">
                {agent.type}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full ${sc.bg} ${sc.text} px-2.5 py-0.5 text-xs font-medium capitalize`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                  {agent.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last seen {formatLastSeen(agent.lastSeenAt)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={savePending}>
                {savePending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Token Card */}
        {regeneratedToken ? (
          <TokenDisplay agent={regeneratedToken} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Connection Token</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Token</Label>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 flex-1 items-center rounded-lg border border-input bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
                    {agent.tokenPrefix}...
                  </div>
                  <Button variant="outline" size="icon" onClick={copyPrefix} className="shrink-0">
                    {tokenCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  onClick={handleRegenerateToken}
                  disabled={regeneratePending}
                >
                  {regeneratePending ? "Regenerating..." : "Regenerate Token"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Regenerating will invalidate the current token. Your agent will need to be reconfigured.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="rounded-xl border-2 border-red-200 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Delete Agent</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this agent and all its run history. This action cannot be undone.
              </p>
            </div>
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletePending}
                >
                  {deletePending ? "Deleting..." : "Confirm Delete"}
                </Button>
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                Delete Agent
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
