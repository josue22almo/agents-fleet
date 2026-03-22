import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class AgentNotFoundError extends DomainError {
  readonly code = "AGENT_NOT_FOUND";

  constructor(id: string) {
    super(`Agent "${id}" not found`);
  }
}
