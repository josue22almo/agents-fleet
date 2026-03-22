import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class InvalidConnectionTokenError extends DomainError {
  readonly code = "INVALID_CONNECTION_TOKEN";

  constructor() {
    super("Invalid or expired connection token");
  }
}
