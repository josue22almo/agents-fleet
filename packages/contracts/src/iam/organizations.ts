import { z } from "zod";

export const CreateOrgRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const UpdateOrgRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const OrgResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OrgListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  memberCount: z.number(),
  canCurrentUserManage: z.boolean(),
});

export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;
export type UpdateOrgRequest = z.infer<typeof UpdateOrgRequestSchema>;
export type OrgResponse = z.infer<typeof OrgResponseSchema>;
export type OrgListItemResponse = z.infer<typeof OrgListItemResponseSchema>;
