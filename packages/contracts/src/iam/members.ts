import { z } from "zod";

const memberRoleEnum = z.enum(["owner", "admin", "member"]);

export const InviteMemberRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: memberRoleEnum.refine((val) => val !== "owner", {
    message: "Cannot invite as owner",
  }),
});

export const ChangeMemberRoleRequestSchema = z.object({
  role: memberRoleEnum,
});

export const MemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isOwner: z.boolean(),
  isAdmin: z.boolean(),
  canManage: z.boolean(),
  joinedAt: z.string(),
});

export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;
export type ChangeMemberRoleRequest = z.infer<typeof ChangeMemberRoleRequestSchema>;
export type MemberResponse = z.infer<typeof MemberResponseSchema>;
