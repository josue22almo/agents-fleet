import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class AlreadyMemberError extends DomainError {
  readonly code = "ALREADY_MEMBER";

  constructor(userId: string, organizationId: string) {
    super(
      `User "${userId}" is already a member of organization "${organizationId}"`,
    );
  }
}
