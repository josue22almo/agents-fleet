import { z } from "zod";

export const InviteDetailsResponseSchema = z.object({
  id: z.string(),
  organizationName: z.string(),
  email: z.string(),
  role: z.string(),
  invitedByName: z.string().nullable(),
  isPending: z.boolean(),
  isExpired: z.boolean(),
});

export type InviteDetailsResponse = z.infer<typeof InviteDetailsResponseSchema>;
