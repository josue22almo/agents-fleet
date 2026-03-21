"use client";

import { useState } from "react";
import { UpdateProfileRequestSchema } from "@repo/contracts/iam";
import { useAuth } from "@/providers/auth-provider";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function EditProfileForm() {
  const { user, logout } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: (formData.get("fullName") as string) || undefined,
      avatarUrl: (formData.get("avatarUrl") as string) || undefined,
    };

    const result = UpdateProfileRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch("/auth/me", result.data);
      setSuccess("Profile updated successfully");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="space-y-8 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError message={formError} />
            {success && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" defaultValue={user?.fullName ?? ""} placeholder="Your name" />
              <FieldError message={fieldErrors.fullName?.[0]} />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-2">Sign Out</h2>
          <p className="text-sm text-muted-foreground mb-4">Sign out from your account on this device.</p>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
