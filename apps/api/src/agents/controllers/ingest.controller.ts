import { Body, Controller, Inject, Post, Req, UseGuards } from "@nestjs/common";
import { IngestEventRequestSchema } from "@repo/contracts/agents";
import { IngestEvent, type RunRepository } from "@repo/contexts/monitoring";
import type { AgentRepository } from "@repo/contexts/agents";
import type { IdGenerator } from "@repo/contexts/_shared";
import { ConnectionTokenGuard } from "../guards/connection-token.guard";

interface AgentRequest {
  agent: { agentId: string; organizationId: string };
}

function formatRunResponse(run: ReturnType<import("@repo/contexts/monitoring").Run["toPrimitives"]>) {
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
    @Inject("RunRepository") runRepo: RunRepository,
    @Inject("AgentRepository") private readonly agentRepo: AgentRepository,
    @Inject("IdGenerator") idGenerator: IdGenerator,
  ) {
    this.ingestEvent = new IngestEvent(runRepo, idGenerator);
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

    // Update agent lastSeenAt + status to active
    const agent = await this.agentRepo.findById(req.agent.agentId);
    if (agent) {
      agent.updateLastSeen();
      agent.markActive();
      await this.agentRepo.save(agent);
    }

    return formatRunResponse(run.toPrimitives());
  }
}
