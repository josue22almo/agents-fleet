"use client";

import { useCreateOrgForm } from "@/hooks/use-create-org-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function CreateOrgForm() {
  const {
    fieldErrors,
    formError,
    slug,
    setSlug,
    isPending,
    handleNameChange,
    handleSubmit,
    goBack,
  } = useCreateOrgForm();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget));
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground mt-1">Set up a new team workspace</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={formError} />

          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Acme Corp"
              onChange={(e) => handleNameChange(e.target.value)}
            />
            <FieldError message={fieldErrors.name?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" name="slug" placeholder="acme-corp" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and hyphens</p>
            <FieldError message={fieldErrors.slug?.[0]} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Organization"}
            </Button>
            <Button type="button" variant="outline" onClick={goBack}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
