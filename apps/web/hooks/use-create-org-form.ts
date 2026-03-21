"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateOrgRequestSchema } from "@repo/contracts/iam";
import { ApiError } from "@/lib/api-client";
import { useCreateOrganization } from "@/hooks/use-organizations";

export function useCreateOrgForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [slug, setSlug] = useState("");
  const createOrg = useCreateOrganization();

  function handleNameChange(name: string) {
    setSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  async function handleSubmit(formData: FormData) {
    setFieldErrors({});
    setFormError("");

    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
    };

    const result = CreateOrgRequestSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(
        result.error.flatten().fieldErrors as Record<string, string[]>,
      );
      return;
    }

    try {
      await createOrg.mutateAsync(result.data);
      router.push("/organizations");
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
    slug,
    setSlug,
    isPending: createOrg.isPending,
    handleNameChange,
    handleSubmit,
    goBack: () => router.back(),
  };
}
