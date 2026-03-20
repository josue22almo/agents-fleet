import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class InvitationExpiredError extends DomainError {
  readonly code = "INVITATION_EXPIRED";

  constructor(token: string) {
    super(`Invitation "${token}" has expired`);
  }
}
