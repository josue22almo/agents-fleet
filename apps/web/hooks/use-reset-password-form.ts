"use client";

import { useState } from "react";
import { ResetPasswordRequestSchema } from "@repo/contracts/iam";
import { api, ApiError } from "@/lib/api-client";

export function useResetPasswordForm(token: string) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");

    const data = { token, password: formData.get("password") as string };

    const result = ResetPasswordRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.auth.resetPassword(result.data);
      setDone(true);
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

  return { fieldErrors, formError, isSubmitting, done, handleSubmit };
}
