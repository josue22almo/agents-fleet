import { InMemoryEventBus } from "../../../_shared/application/in-memory-event-bus";
import { InMemoryAgentRepository } from "../../infrastructure/persistence/in-memory-agent-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { IAMContextPort } from "../../../_shared/domain/ports/iam-context-port";

export const mockIAM: IAMContextPort = {
  canUserManageOrganization: async () => true,
  isUserOwnerOfOrganization: async () => true,
};

export function createTestDeps() {
  let idCounter = 0;

  const agentRepo = new InMemoryAgentRepository();
  const iam = mockIAM;
  const eventBus = new InMemoryEventBus();

  const idGenerator: IdGenerator = {
    generate: () => `id-${++idCounter}`,
  };

  return {
    agentRepo,
    iam,
    eventBus,
    idGenerator,
  };
}
