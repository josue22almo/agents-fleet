import { z } from "zod";

export const CreateAgentRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["claude", "manus", "custom"]),
  organizationId: z.string().min(1, "Organization ID is required"),
});

export const UpdateAgentRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const AgentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  tokenPrefix: z.string(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
});

export const AgentListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  lastSeenAt: z.string().nullable(),
});

export const AgentWithTokenResponseSchema = AgentResponseSchema.extend({
  connectionToken: z.string(),
});

export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequestSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type AgentListItemResponse = z.infer<typeof AgentListItemResponseSchema>;
export type AgentWithTokenResponse = z.infer<typeof AgentWithTokenResponseSchema>;
