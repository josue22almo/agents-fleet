"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { ResetPasswordRequestSchema } from "@repo/contracts/iam";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const data = { token, password: formData.get("password") as string };

    const result = ResetPasswordRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", result.data);
      setDone(true);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your password has been reset successfully.
          </p>
        </div>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
            Sign in with your new password
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground mb-4">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-2">Enter your new password below</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={formError} />

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" placeholder="Min 8 characters" />
            <FieldError message={fieldErrors.password?.[0]} />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </>
  );
}
