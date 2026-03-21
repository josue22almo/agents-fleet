"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, CheckCircle } from "lucide-react";
import { ForgotPasswordRequestSchema } from "@repo/contracts/iam";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function ForgotPasswordForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    const formData = new FormData(e.currentTarget);
    const data = { email: formData.get("email") as string };

    const result = ForgotPasswordRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", result.data);
      setSent(true);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground mb-4">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={formError} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@example.com" />
            <FieldError message={fieldErrors.email?.[0]} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>

      {sent && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm mt-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Check your email</p>
              <p className="text-xs text-emerald-600 mt-1">
                We&apos;ve sent a password reset link to your email address. The link expires in 1 hour.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        Remember your password?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
