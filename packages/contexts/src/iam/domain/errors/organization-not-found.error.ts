import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class OrganizationNotFoundError extends DomainError {
  readonly code = "ORGANIZATION_NOT_FOUND";

  constructor(id: string) {
    super(`Organization "${id}" not found`);
  }
}
