"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";

export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const avatarUrl = await api.avatars.upload(user.id, file);
      await api.auth.updateProfile({ avatarUrl });
      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadMutation.mutate(file, {
      onError: (err) => {
        setPreview(null);
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to upload avatar",
        );
      },
    });
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  const currentAvatarUrl = preview ?? user?.avatarUrl ?? null;
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return {
    currentAvatarUrl,
    initials,
    error,
    isPending: uploadMutation.isPending,
    fileInputRef,
    handleFileSelect,
    triggerFileSelect,
  };
}
