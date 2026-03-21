"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useSignInForm } from "@/hooks/use-sign-in-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FormError } from "@/components/ui/form-error";

export function SignInForm() {
  const { fieldErrors, formError, isSubmitting, handleSubmit } =
    useSignInForm();

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
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-2">Sign in to Agents Fleet</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError message={formError} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@example.com" />
            <FieldError message={fieldErrors.email?.[0]} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline underline-offset-4">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="Enter your password" />
            <FieldError message={fieldErrors.password?.[0]} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </>
  );
}
