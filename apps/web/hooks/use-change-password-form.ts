"use client";

import { useState } from "react";
import { ChangePasswordRequestSchema } from "@repo/contracts/iam";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";

export function useChangePasswordForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.auth.changePassword(data),
  });

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");
    setSuccess("");

    const data = {
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
    };

    const result = ChangePasswordRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    try {
      await changePassword.mutateAsync(result.data);
      setSuccess("Password changed successfully");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred",
      );
    }
  }

  return {
    fieldErrors,
    formError,
    success,
    isPending: changePassword.isPending,
    handleSubmit,
  };
}
