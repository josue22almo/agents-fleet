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
  ListRuns,
  GetAgentMetrics,
  type RunRepository,
} from "@repo/contexts/monitoring";
import type { IdGenerator, EventBus } from "@repo/contexts/_shared";

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

@Controller("mcp")
export class McpController {
  private readonly validateConnectionToken: ValidateConnectionToken;
  private readonly ingestEvent: IngestEvent;
  private readonly listRuns: ListRuns;
  private readonly getAgent: GetAgent;
  private readonly getAgentMetrics: GetAgentMetrics;

  constructor(
    @Inject("AdminAgentRepository") agentRepo: AgentRepository,
    @Inject("AdminRunRepository") runRepo: RunRepository,
    @Inject("EventBus") eventBus: EventBus,
    @Inject("IdGenerator") idGenerator: IdGenerator,
  ) {
    this.validateConnectionToken = new ValidateConnectionToken(agentRepo);
    this.ingestEvent = new IngestEvent(runRepo, idGenerator, eventBus);
    this.listRuns = new ListRuns(runRepo);
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
      "report_run_started",
      {
        description: "Report that a new agent run has begun",
        inputSchema: {
          runId: z.string().describe("Unique identifier for this run"),
          metadata: z.record(z.unknown()).optional().describe("Optional metadata about the run"),
        },
      },
      async ({ runId, metadata }) => {
        const run = await this.ingestEvent.execute({
          agentId,
          event: "run.started",
          externalRunId: runId,
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
