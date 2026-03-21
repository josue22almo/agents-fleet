import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class UserNotFoundError extends DomainError {
  readonly code = "USER_NOT_FOUND";

  constructor(userId: string) {
    super(`User "${userId}" not found`);
  }
}
