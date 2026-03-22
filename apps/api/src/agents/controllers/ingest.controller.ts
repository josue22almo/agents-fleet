import { Body, Controller, Inject, Post, Req, UseGuards } from "@nestjs/common";
import { IngestEventRequestSchema, RunResponseSchema } from "@repo/contracts/agents";
import { IngestEvent, type RunRepository } from "@repo/contexts/monitoring";
import type { IdGenerator, EventBus } from "@repo/contexts/_shared";
import { ConnectionTokenGuard } from "../guards/connection-token.guard";

interface AgentRequest {
  agent: { agentId: string; organizationId: string };
}

function formatRun(run: ReturnType<import("@repo/contexts/monitoring").Run["toPrimitives"]>) {
  return {
    id: run.id,
    agentId: run.agentId,
    externalRunId: run.externalRunId,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
    durationMs: run.durationMs,
    tokensUsed: run.tokensUsed,
    cost: run.cost,
    error: run.error,
    metadata: run.metadata,
  };
}

@Controller("ingest")
@UseGuards(ConnectionTokenGuard)
export class IngestController {
  private readonly ingestEvent: IngestEvent;

  constructor(
    @Inject("AdminRunRepository") runRepo: RunRepository,
    @Inject("EventBus") eventBus: EventBus,
    @Inject("IdGenerator") idGenerator: IdGenerator,
  ) {
    this.ingestEvent = new IngestEvent(runRepo, idGenerator, eventBus);
  }

  @Post()
  async handleIngest(@Req() req: AgentRequest, @Body() body: unknown) {
    const data = IngestEventRequestSchema.parse(body);

    const run = await this.ingestEvent.execute({
      agentId: req.agent.agentId,
      event: data.event,
      externalRunId: data.runId,
      timestamp: data.timestamp,
      data: data.data,
    });

    return RunResponseSchema.parse(formatRun(run.toPrimitives()));
  }
}
