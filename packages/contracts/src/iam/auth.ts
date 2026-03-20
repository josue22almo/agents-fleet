import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const SignUpRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().nullable().optional(),
});

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const AuthTokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const ProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().nullable().optional(),
  avatarUrl: z.string().url("Invalid URL").nullable().optional(),
});

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type AuthTokensResponse = z.infer<typeof AuthTokensResponseSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
