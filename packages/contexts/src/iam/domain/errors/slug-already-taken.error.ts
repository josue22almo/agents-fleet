import { DomainError } from "../../../_shared/domain/errors/domain-error.js";

export class SlugAlreadyTakenError extends DomainError {
  readonly code = "SLUG_ALREADY_TAKEN";

  constructor(slug: string) {
    super(`The slug "${slug}" is already in use`);
  }
}
