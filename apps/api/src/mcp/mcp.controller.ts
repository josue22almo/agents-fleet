import { Controller, Post, Get, Delete, Req, Res, Inject } from "@nestjs/common";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  ValidateConnectionToken,
  GetAgent,
  type AgentRepository,
} from "@repo/contexts/agents";
import {
  IngestEvent,
  IngestSessionEvent,
  IngestToolCall,
  ListRuns,
  ListSessions,
  GetAgentMetrics,
  type RunRepository,
  type SessionRepository,
  type ToolCallRepository,
} from "@repo/contexts/monitoring";
import type { IdGenerator, EventBus } from "@repo/contexts/_shared";

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

@Controller("mcp")
export class McpController {
  private readonly validateConnectionToken: ValidateConnectionToken;
  private readonly ingestEvent: IngestEvent;
  private readonly ingestSessionEvent: IngestSessionEvent;
  private readonly ingestToolCall: IngestToolCall;
  private readonly listRuns: ListRuns;
  private readonly listSessions: ListSessions;
  private readonly getAgent: GetAgent;
  private readonly getAgentMetrics: GetAgentMetrics;

  constructor(
    @Inject("AdminAgentRepository") agentRepo: AgentRepository,
    @Inject("AdminRunRepository") runRepo: RunRepository,
    @Inject("AdminSessionRepository") sessionRepo: SessionRepository,
    @Inject("AdminToolCallRepository") toolCallRepo: ToolCallRepository,
    @Inject("EventBus") eventBus: EventBus,
    @Inject("IdGenerator") idGenerator: IdGenerator,
  ) {
    this.validateConnectionToken = new ValidateConnectionToken(agentRepo);
    this.ingestEvent = new IngestEvent(runRepo, idGenerator, eventBus, sessionRepo);
    this.ingestSessionEvent = new IngestSessionEvent(sessionRepo, idGenerator);
    this.ingestToolCall = new IngestToolCall(toolCallRepo, runRepo, idGenerator);
    this.listRuns = new ListRuns(runRepo);
    this.listSessions = new ListSessions(sessionRepo);
    this.getAgent = new GetAgent(agentRepo);
    this.getAgentMetrics = new GetAgentMetrics(runRepo);
  }

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response) {
    await this.handleMcpRequest(req, res);
  }

  @Get()
  async handleGet(@Req() req: Request, @Res() res: Response) {
    await this.handleMcpRequest(req, res);
  }

  @Delete()
  async handleDelete(@Req() req: Request, @Res() res: Response) {
    await this.handleMcpRequest(req, res);
  }

  private async handleMcpRequest(req: Request, res: Response) {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Missing connection token" });
      return;
    }

    let agentId: string;
    try {
      const result = await this.validateConnectionToken.execute(token);
      agentId = result.agentId;
    } catch {
      res.status(401).json({ error: "Invalid or expired connection token" });
      return;
    }

    const server = this.createMcpServer(agentId);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    try {
      await transport.handleRequest(req, res, req.body);
    } finally {
      await transport.close();
      await server.close();
    }
  }

  private createMcpServer(agentId: string): McpServer {
    const server = new McpServer({
      name: "agents-fleet",
      version: "1.0.0",
    });

    server.registerTool(
      "start_session",
      {
        description: "Start a new session to group related runs",
        inputSchema: {
          name: z.string().optional().describe("Optional session name (e.g., 'Code review PR #42')"),
          metadata: z.record(z.unknown()).optional().describe("Optional metadata about the session"),
        },
      },
      async ({ name, metadata }) => {
        const session = await this.ingestSessionEvent.execute({
          agentId,
          event: "session.started",
          data: { name, metadata },
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(formatSession(session.toPrimitives())) }],
        };
      },
    );

    server.registerTool(
      "end_session",
      {
        description: "End an active session (complete or fail it)",
        inputSchema: {
          sessionId: z.string().describe("Session ID to end"),
          status: z.enum(["completed", "failed"]).default("completed").describe("Final status"),
          totalDurationMs: z.number().optional().describe("Total duration in milliseconds"),
          totalTokensUsed: z.number().optional().describe("Total tokens consumed"),
          totalCost: z.number().optional().describe("Total cost in USD"),
        },
      },
      async ({ sessionId, status, totalDurationMs, totalTokensUsed, totalCost }) => {
        const event = status === "failed" ? "session.failed" : "session.completed";
        const session = await this.ingestSessionEvent.execute({
          agentId,
          event,
          sessionId,
          data: { totalDurationMs, totalTokensUsed, totalCost },
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(formatSession(session.toPrimitives())) }],
        };
      },
    );

    server.registerTool(
      "get_my_sessions",
      {
        description: "Get this agent's recent sessions",
        inputSchema: {
          limit: z.number().optional().default(10).describe("Maximum number of sessions to return (default 10)"),
        },
      },
      async ({ limit }) => {
        const result = await this.listSessions.execute({
          agentId,
          page: 1,
          pageSize: limit,
        });

        const sessions = result.sessions.map((s) => formatSession(s.toPrimitives()));
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ sessions, total: result.total }) }],
        };
      },
    );

    server.registerTool(
      "report_run_started",
      {
        description: "Report that a new agent run has begun",
        inputSchema: {
          runId: z.string().describe("Unique identifier for this run"),
          sessionId: z.string().optional().describe("Optional session ID to link this run to"),
          metadata: z.record(z.unknown()).optional().describe("Optional metadata about the run"),
        },
      },
      async ({ runId, sessionId, metadata }) => {
        const run = await this.ingestEvent.execute({
          agentId,
          event: "run.started",
          externalRunId: runId,
          sessionId,
          data: metadata ? { metadata } : undefined,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(formatRun(run.toPrimitives())) }],
        };
      },
    );

    server.registerTool(
      "report_run_completed",
      {
        description: "Report that an agent run has completed successfully",
        inputSchema: {
          runId: z.string().describe("Unique identifier for this run"),
          durationMs: z.number().optional().describe("Total duration in milliseconds"),
          tokensUsed: z.number().optional().describe("Total tokens consumed"),
          cost: z.number().optional().describe("Estimated cost in USD"),
          metadata: z.record(z.unknown()).optional().describe("Optional metadata about the run"),
        },
      },
      async ({ runId, durationMs, tokensUsed, cost, metadata }) => {
        const run = await this.ingestEvent.execute({
          agentId,
          event: "run.completed",
          externalRunId: runId,
          data: { durationMs, tokensUsed, cost, metadata },
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(formatRun(run.toPrimitives())) }],
        };
      },
    );

    server.registerTool(
      "report_run_failed",
      {
        description: "Report that an agent run has failed",
        inputSchema: {
          runId: z.string().describe("Unique identifier for this run"),
          error: z.string().describe("Error message describing the failure"),
          durationMs: z.number().optional().describe("Total duration in milliseconds"),
          tokensUsed: z.number().optional().describe("Total tokens consumed"),
          metadata: z.record(z.unknown()).optional().describe("Optional metadata about the run"),
        },
      },
      async ({ runId, error, durationMs, tokensUsed, metadata }) => {
        const run = await this.ingestEvent.execute({
          agentId,
          event: "run.failed",
          externalRunId: runId,
          data: { error, durationMs, tokensUsed, metadata },
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(formatRun(run.toPrimitives())) }],
        };
      },
    );

    server.registerTool(
      "report_tool_call",
      {
        description: "Report a tool call that happened during a run",
        inputSchema: {
          runId: z.string().describe("Run ID this tool call belongs to"),
          toolName: z.string().describe("Name of the tool that was called"),
          durationMs: z.number().optional().describe("Duration of the tool call in milliseconds"),
          success: z.boolean().optional().default(true).describe("Whether the tool call succeeded"),
        },
      },
      async ({ runId, toolName, durationMs, success }) => {
        const toolCall = await this.ingestToolCall.execute({
          agentId,
          externalRunId: runId,
          toolName,
          durationMs,
          success,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(toolCall.toPrimitives()) }],
        };
      },
    );

    server.registerTool(
      "get_my_recent_runs",
      {
        description: "Get this agent's recent runs",
        inputSchema: {
          limit: z.number().optional().default(10).describe("Maximum number of runs to return (default 10)"),
        },
      },
      async ({ limit }) => {
        const result = await this.listRuns.execute({
          agentId,
          page: 1,
          pageSize: limit,
        });

        const runs = result.runs.map((r) => formatRun(r.toPrimitives()));
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ runs, total: result.total }) }],
        };
      },
    );

    server.registerTool(
      "get_my_status",
      {
        description: "Get this agent's current status and stats",
      },
      async () => {
        const [agent, metrics] = await Promise.all([
          this.getAgent.execute({ agentId }),
          this.getAgentMetrics.execute(agentId),
        ]);

        const agentData = agent.toPrimitives();
        const metricsData = metrics.toPrimitives();

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              id: agentData.id,
              name: agentData.name,
              type: agentData.type,
              status: agentData.status,
              lastSeenAt: agentData.lastSeenAt?.toISOString() ?? null,
              metrics: {
                totalRuns: metricsData.totalRuns,
                successRate: metricsData.successRate,
                avgDurationMs: metricsData.avgDurationMs,
                totalCost: metricsData.totalCost,
                activeRuns: metricsData.activeRuns,
              },
            }),
          }],
        };
      },
    );

    return server;
  }
}
