import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { InMemoryEventBus } from "@repo/contexts/_shared";
import { InMemoryAgentRepository, UpdateAgentOnRunIngestedEventHandler } from "@repo/contexts/agents";
import { InMemoryOrganizationRepository } from "@repo/contexts/iam";
import { InMemoryRunRepository, InMemorySessionRepository, InMemoryToolCallRepository } from "@repo/contexts/monitoring";
import { TestIamModule } from "../iam/test-iam.module";

import { AgentsController } from "./controllers/agents.controller";
import { IngestController } from "./controllers/ingest.controller";
import { RunsController } from "./controllers/runs.controller";

let idCounter = 0;

@Module({
  imports: [TestIamModule, EventEmitterModule.forRoot()],
  controllers: [AgentsController, IngestController, RunsController],
  providers: [
    {
      provide: "AgentRepository",
      useFactory: () => new InMemoryAgentRepository(),
    },
    {
      provide: "AdminAgentRepository",
      useExisting: "AgentRepository",
    },
    {
      provide: "OrganizationRepository",
      useFactory: () => new InMemoryOrganizationRepository(),
    },
    {
      provide: "IAMContextPort",
      useValue: {
        canUserManageOrganization: async () => true,
        isUserOwnerOfOrganization: async () => true,
      },
    },
    {
      provide: "RunRepository",
      useFactory: () => new InMemoryRunRepository(),
    },
    {
      provide: "AdminRunRepository",
      useExisting: "RunRepository",
    },
    {
      provide: "SessionRepository",
      useFactory: () => new InMemorySessionRepository(),
    },
    {
      provide: "AdminSessionRepository",
      useExisting: "SessionRepository",
    },
    {
      provide: "ToolCallRepository",
      useFactory: () => new InMemoryToolCallRepository(),
    },
    {
      provide: "AdminToolCallRepository",
      useExisting: "ToolCallRepository",
    },
    {
      provide: "EventBus",
      useFactory: (agentRepo: InMemoryAgentRepository) => {
        const eventBus = new InMemoryEventBus();
        eventBus.register(new UpdateAgentOnRunIngestedEventHandler(agentRepo));
        return eventBus;
      },
      inject: ["AgentRepository"],
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => `id-${++idCounter}` },
    },
  ],
  exports: ["AgentRepository", "OrganizationRepository", "RunRepository", "SessionRepository", "ToolCallRepository"],
})
export class TestAgentsModule {}
