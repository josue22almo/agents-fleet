import { Body, Controller, Inject, Post, Req, UseGuards } from "@nestjs/common";
import {
  IngestEventRequestSchema,
  RunResponseSchema,
  SessionResponseSchema,
} from "@repo/contracts/agents";
import {
  IngestEvent,
  IngestSessionEvent,
  type RunRepository,
  type SessionRepository,
} from "@repo/contexts/monitoring";
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
    sessionId: run.sessionId,
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

function formatSession(session: ReturnType<import("@repo/contexts/monitoring").Session["toPrimitives"]>) {
  return {
    id: session.id,
    agentId: session.agentId,
    name: session.name,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    totalDurationMs: session.totalDurationMs,
    totalTokensUsed: session.totalTokensUsed,
    totalCost: session.totalCost,
    runCount: session.runCount,
    metadata: session.metadata,
  };
}

@Controller("ingest")
@UseGuards(ConnectionTokenGuard)
export class IngestController {
  private readonly ingestEvent: IngestEvent;
  private readonly ingestSessionEvent: IngestSessionEvent;

  constructor(
    @Inject("AdminRunRepository") runRepo: RunRepository,
    @Inject("AdminSessionRepository") sessionRepo: SessionRepository,
    @Inject("EventBus") eventBus: EventBus,
    @Inject("IdGenerator") idGenerator: IdGenerator,
  ) {
    this.ingestEvent = new IngestEvent(runRepo, idGenerator, eventBus, sessionRepo);
    this.ingestSessionEvent = new IngestSessionEvent(sessionRepo, idGenerator);
  }

  @Post()
  async handleIngest(@Req() req: AgentRequest, @Body() body: unknown) {
    const data = IngestEventRequestSchema.parse(body);

    if (data.event.startsWith("session.")) {
      const session = await this.ingestSessionEvent.execute({
        agentId: req.agent.agentId,
        event: data.event as "session.started" | "session.completed" | "session.failed",
        sessionId: data.sessionId,
        data: data.data,
      });

      return SessionResponseSchema.parse(formatSession(session.toPrimitives()));
    }

    if (!data.runId) {
      throw new Error("runId is required for run events");
    }

    const run = await this.ingestEvent.execute({
      agentId: req.agent.agentId,
      event: data.event as "run.started" | "run.completed" | "run.failed",
      externalRunId: data.runId,
      sessionId: data.sessionId,
      timestamp: data.timestamp,
      data: data.data,
    });

    return RunResponseSchema.parse(formatRun(run.toPrimitives()));
  }
}
