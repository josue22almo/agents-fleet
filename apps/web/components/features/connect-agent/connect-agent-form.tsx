"use client";

import { useCreateAgentForm } from "@/hooks/use-create-agent-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";
import { TokenDisplay } from "@/components/features/connect-agent/token-display";

export function ConnectAgentForm() {
  const {
    fieldErrors,
    formError,
    isPending,
    createdAgent,
    handleSubmit,
    goBack,
    goToAgents,
  } = useCreateAgentForm();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget));
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Connect Agent</h1>
        <p className="text-muted-foreground mt-1">Set up a new agent connection</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <FormError message={formError} />

            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Claude Code — Production"
                disabled={!!createdAgent}
              />
              <FieldError message={fieldErrors.name?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Agent Type</Label>
              <Select name="type" defaultValue="claude" disabled={!!createdAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="manus">Manus</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={fieldErrors.type?.[0]} />
            </div>

            {!createdAgent && (
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Connecting..." : "Connect Agent"}
                </Button>
                <Button type="button" variant="ghost" onClick={goBack}>
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </div>

        {createdAgent && (
          <>
            <TokenDisplay agent={createdAgent} />
            <div className="flex justify-end">
              <Button onClick={goToAgents}>Go to Agents</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
