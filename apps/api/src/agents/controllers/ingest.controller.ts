import { Body, Controller, Inject, Post, Req, UseGuards } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  IngestEventRequestSchema,
  RunResponseSchema,
  SessionResponseSchema,
} from "@repo/contracts/agents";
import {
  IngestEvent,
  IngestSessionEvent,
  IngestToolCall,
  type RunRepository,
  type SessionRepository,
  type ToolCallRepository,
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
  private readonly ingestToolCall: IngestToolCall;

  constructor(
    @Inject("AdminRunRepository") runRepo: RunRepository,
    @Inject("AdminSessionRepository") sessionRepo: SessionRepository,
    @Inject("AdminToolCallRepository") toolCallRepo: ToolCallRepository,
    @Inject("EventBus") eventBus: EventBus,
    @Inject("IdGenerator") idGenerator: IdGenerator,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {
    this.ingestEvent = new IngestEvent(runRepo, idGenerator, eventBus, sessionRepo);
    this.ingestSessionEvent = new IngestSessionEvent(sessionRepo, idGenerator);
    this.ingestToolCall = new IngestToolCall(toolCallRepo, runRepo, idGenerator);
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

      this.eventEmitter.emit("activity.session", {
        agentId: req.agent.agentId,
        type: data.event,
        timestamp: new Date().toISOString(),
      });

      return SessionResponseSchema.parse(formatSession(session.toPrimitives()));
    }

    if (data.event === "tool.called") {
      if (!data.runId) {
        throw new Error("runId is required for tool.called events");
      }
      const toolCall = await this.ingestToolCall.execute({
        agentId: req.agent.agentId,
        externalRunId: data.runId,
        toolName: data.data?.toolName ?? "unknown",
        durationMs: data.data?.durationMs,
        success: data.data?.success,
      });
      return { id: toolCall.id, toolName: toolCall.toPrimitives().toolName };
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

    this.eventEmitter.emit("activity.run", {
      agentId: req.agent.agentId,
      type: data.event,
      detail: data.data?.error || (data.data?.durationMs ? `${data.data.durationMs}ms` : undefined),
      timestamp: new Date().toISOString(),
    });

    return RunResponseSchema.parse(formatRun(run.toPrimitives()));
  }
}
