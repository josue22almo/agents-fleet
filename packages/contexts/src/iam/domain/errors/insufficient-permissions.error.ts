import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class InsufficientPermissionsError extends DomainError {
  readonly code = "INSUFFICIENT_PERMISSIONS";

  constructor(action?: string) {
    super(
      action
        ? `You do not have permission to ${action}`
        : "You do not have permission to perform this action",
    );
  }
}
