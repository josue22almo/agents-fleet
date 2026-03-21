import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";

  constructor() {
    super("Invalid email or password");
  }
}
