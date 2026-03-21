"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useSignUpForm } from "@/hooks/use-sign-up-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function SignUpForm() {
  const { fieldErrors, formError, isSubmitting, handleSubmit } =
    useSignUpForm();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget));
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground mb-4">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-2">Start monitoring your agents in minutes</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={formError} />

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@example.com" />
            <FieldError message={fieldErrors.email?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Create a password" />
            <FieldError message={fieldErrors.password?.[0]} />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
