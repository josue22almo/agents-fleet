import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class InvalidTokenError extends DomainError {
  readonly code = "INVALID_TOKEN";

  constructor() {
    super("The provided token is invalid or has expired");
  }
}
