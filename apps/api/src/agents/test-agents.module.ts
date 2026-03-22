import { Module } from "@nestjs/common";
import { InMemoryEventBus } from "@repo/contexts/_shared";
import { InMemoryAgentRepository } from "@repo/contexts/agents";
import { InMemoryOrganizationRepository } from "@repo/contexts/iam";
import { InMemoryRunRepository } from "@repo/contexts/monitoring";
import { TestIamModule } from "../iam/test-iam.module";

import { AgentsController } from "./controllers/agents.controller";
import { IngestController } from "./controllers/ingest.controller";
import { RunsController } from "./controllers/runs.controller";

let idCounter = 0;

@Module({
  imports: [TestIamModule],
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
      provide: "RunRepository",
      useFactory: () => new InMemoryRunRepository(),
    },
    {
      provide: "AdminRunRepository",
      useExisting: "RunRepository",
    },
    {
      provide: "EventBus",
      useFactory: () => new InMemoryEventBus(),
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => `id-${++idCounter}` },
    },
  ],
  exports: ["AgentRepository", "OrganizationRepository", "RunRepository"],
})
export class TestAgentsModule {}
