"use client";

import { useState } from "react";
import { SignUpRequestSchema } from "@repo/contracts/iam";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";

export function useSignUpForm() {
  const { signup } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullName: (formData.get("fullName") as string) || undefined,
    };

    const result = SignUpRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(
        result.data.email,
        result.data.password,
        result.data.fullName ?? undefined,
      );
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return { fieldErrors, formError, isSubmitting, handleSubmit };
}
