import type { Invitation } from "../../domain/entities/invitation.js";

export interface InvitationRepository {
  findByToken(token: string): Promise<Invitation | null>;
  findPendingByOrgAndEmail(organizationId: string, email: string): Promise<Invitation | null>;
  save(invitation: Invitation): Promise<void>;
}
