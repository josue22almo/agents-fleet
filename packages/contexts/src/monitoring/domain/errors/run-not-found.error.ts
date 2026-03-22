import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class RunNotFoundError extends DomainError {
  readonly code = "RUN_NOT_FOUND";

  constructor(id: string) {
    super(`Run "${id}" not found`);
  }
}
