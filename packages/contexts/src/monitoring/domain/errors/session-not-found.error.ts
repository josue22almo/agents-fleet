import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class SessionNotFoundError extends DomainError {
  readonly code = "SESSION_NOT_FOUND";

  constructor(id: string) {
    super(`Session "${id}" not found`);
  }
}
