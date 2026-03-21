"use client";

import { useState } from "react";
import { ForgotPasswordRequestSchema } from "@repo/contracts/iam";
import { api, ApiError } from "@/lib/api-client";

export function useForgotPasswordForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");

    const data = { email: formData.get("email") as string };

    const result = ForgotPasswordRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.auth.forgotPassword(result.data);
      setSent(true);
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

  return { fieldErrors, formError, isSubmitting, sent, handleSubmit };
}
