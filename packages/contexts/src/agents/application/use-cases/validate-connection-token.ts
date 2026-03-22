import { InvalidConnectionTokenError } from "../../domain/errors/invalid-connection-token.error";
import { ConnectionToken } from "../../domain/value-objects/connection-token";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

interface ValidateConnectionTokenResult {
  agentId: string;
  organizationId: string;
}

export class ValidateConnectionToken {
  constructor(private readonly agentRepo: AgentRepository) {}

  async execute(rawToken: string): Promise<ValidateConnectionTokenResult> {
    const hash = ConnectionToken.hashValue(rawToken);
    const agent = await this.agentRepo.findByTokenHash(hash);

    if (!agent) {
      throw new InvalidConnectionTokenError();
    }

    const primitives = agent.toPrimitives();
    return {
      agentId: agent.id,
      organizationId: primitives.organizationId,
    };
  }
}
