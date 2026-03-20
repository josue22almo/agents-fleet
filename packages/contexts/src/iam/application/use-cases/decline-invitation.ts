import { InvalidTokenError } from "../../domain/errors/invalid-token.error.js";
import type { InvitationRepository } from "../../ports/repositories/invitation-repository.js";

export class DeclineInvitation {
  constructor(private readonly invitationRepo: InvitationRepository) {}

  async execute(token: string): Promise<void> {
    const invitation = await this.invitationRepo.findByToken(token);
    if (!invitation) throw new InvalidTokenError();

    invitation.decline();
    await this.invitationRepo.save(invitation);
  }
}
