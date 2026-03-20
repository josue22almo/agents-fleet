import type { Invitation } from "../../domain/entities/invitation.js";
import type { InvitationRepository } from "../../ports/repositories/invitation-repository.js";

export class InMemoryInvitationRepository implements InvitationRepository {
  private invitations: Map<string, Invitation> = new Map();

  async findByToken(token: string): Promise<Invitation | null> {
    for (const invitation of this.invitations.values()) {
      if (invitation.hasToken(token)) return invitation;
    }
    return null;
  }

  async findPendingByOrgAndEmail(
    organizationId: string,
    email: string,
  ): Promise<Invitation | null> {
    for (const invitation of this.invitations.values()) {
      const primitives = invitation.toPrimitives();
      if (
        primitives.organizationId === organizationId &&
        primitives.email === email &&
        invitation.isPending
      ) {
        return invitation;
      }
    }
    return null;
  }

  async save(invitation: Invitation): Promise<void> {
    this.invitations.set(invitation.id, invitation);
  }
}
