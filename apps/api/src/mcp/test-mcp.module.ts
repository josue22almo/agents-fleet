import { Module } from "@nestjs/common";
import { InMemoryEventBus } from "@repo/contexts/_shared";
import { InMemoryAgentRepository, UpdateAgentOnRunIngestedEventHandler } from "@repo/contexts/agents";
import { InMemoryRunRepository } from "@repo/contexts/monitoring";

import { McpController } from "./mcp.controller";

let idCounter = 0;

@Module({
  controllers: [McpController],
  providers: [
    {
      provide: "AdminAgentRepository",
      useFactory: () => new InMemoryAgentRepository(),
    },
    {
      provide: "AdminRunRepository",
      useFactory: () => new InMemoryRunRepository(),
    },
    {
      provide: "EventBus",
      useFactory: (agentRepo: InMemoryAgentRepository) => {
        const eventBus = new InMemoryEventBus();
        eventBus.register(new UpdateAgentOnRunIngestedEventHandler(agentRepo));
        return eventBus;
      },
      inject: ["AdminAgentRepository"],
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => `mcp-id-${++idCounter}` },
    },
  ],
  exports: ["AdminAgentRepository", "AdminRunRepository"],
})
export class TestMcpModule {}
