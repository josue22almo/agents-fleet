"use client";

import { useState } from "react";
import { UpdateProfileRequestSchema } from "@repo/contracts/iam";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api-client";
import { useUpdateProfile } from "@/hooks/use-profile";

export function useEditProfileForm() {
  const { user, logout } = useAuth();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const updateProfile = useUpdateProfile();

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");
    setSuccess("");

    const data = {
      fullName: (formData.get("fullName") as string) || undefined,
      avatarUrl: (formData.get("avatarUrl") as string) || undefined,
    };

    const result = UpdateProfileRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    try {
      await updateProfile.mutateAsync(result.data);
      setSuccess("Profile updated successfully");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "An unexpected error occurred",
      );
    }
  }

  return {
    user,
    fieldErrors,
    formError,
    success,
    isPending: updateProfile.isPending,
    handleSubmit,
    logout,
  };
}
