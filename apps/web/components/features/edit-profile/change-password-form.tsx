"use client";

import { useChangePasswordForm } from "@/hooks/use-change-password-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function ChangePasswordForm() {
  const {
    fieldErrors,
    formError,
    success,
    isPending,
    handleSubmit,
  } = useChangePasswordForm();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-4">Change Password</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={formError} />
        {success && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="Enter current password"
          />
          <FieldError message={fieldErrors.currentPassword?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Enter new password"
          />
          <FieldError message={fieldErrors.newPassword?.[0]} />
          <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
