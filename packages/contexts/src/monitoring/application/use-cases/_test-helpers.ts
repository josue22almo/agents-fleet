import { InMemoryRunRepository } from "../../infrastructure/persistence/in-memory-run-repository";
import { InMemorySessionRepository } from "../../infrastructure/persistence/in-memory-session-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { AgentsContextPort } from "../../../_shared/domain/ports/agents-context-port";

export function createStubAgentsPort(
  agentIds: string[] = [],
  agentNames: Record<string, string> = {},
): AgentsContextPort {
  return {
    getAgentIdsForOrganization: async () => agentIds,
    getAgentNamesByIds: async () => agentNames,
  };
}

export function createTestDeps() {
  let idCounter = 0;

  const runRepo = new InMemoryRunRepository();
  const sessionRepo = new InMemorySessionRepository();

  const idGenerator: IdGenerator = {
    generate: () => `id-${++idCounter}`,
  };

  return {
    runRepo,
    sessionRepo,
    idGenerator,
  };
}
