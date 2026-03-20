import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class InvitationAlreadyRespondedError extends DomainError {
  readonly code = "INVITATION_ALREADY_RESPONDED";

  constructor(status: string) {
    super(`Invitation has already been ${status}`);
  }
}
