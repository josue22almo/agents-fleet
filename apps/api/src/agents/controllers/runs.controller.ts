import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import {
  PaginatedRunsResponseSchema,
  AgentMetricsResponseSchema,
  DashboardMetricsResponseSchema,
  PaginatedSessionsResponseSchema,
  SessionWithRunsResponseSchema,
} from "@repo/contracts/agents";
import {
  ListRuns,
  GetAgentMetrics,
  GetDashboardMetrics,
  ListSessions,
  GetSession,
  type RunRepository,
  type SessionRepository,
} from "@repo/contexts/monitoring";
import { ListAgents, type AgentRepository } from "@repo/contexts/agents";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

function formatRunResponse(run: ReturnType<import("@repo/contexts/monitoring").Run["toPrimitives"]>) {
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

function formatSessionListItem(session: ReturnType<import("@repo/contexts/monitoring").Session["toPrimitives"]>) {
  return {
    id: session.id,
    agentId: session.agentId,
    name: session.name,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    totalDurationMs: session.totalDurationMs,
    totalCost: session.totalCost,
    runCount: session.runCount,
  };
}

function formatSessionResponse(session: ReturnType<import("@repo/contexts/monitoring").Session["toPrimitives"]>) {
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

@Controller()
@UseGuards(JwtAuthGuard)
export class RunsController {
  private readonly listRuns: ListRuns;
  private readonly getAgentMetrics: GetAgentMetrics;
  private readonly getDashboardMetrics: GetDashboardMetrics;
  private readonly listAgents: ListAgents;
  private readonly listSessions: ListSessions;
  private readonly getSession: GetSession;

  constructor(
    @Inject("RunRepository") runRepo: RunRepository,
    @Inject("AgentRepository") agentRepo: AgentRepository,
    @Inject("SessionRepository") sessionRepo: SessionRepository,
  ) {
    this.listRuns = new ListRuns(runRepo);
    this.getAgentMetrics = new GetAgentMetrics(runRepo);
    this.getDashboardMetrics = new GetDashboardMetrics(runRepo);
    this.listAgents = new ListAgents(agentRepo);
    this.listSessions = new ListSessions(sessionRepo);
    this.getSession = new GetSession(sessionRepo, runRepo);
  }

  @Get("agents/:id/runs")
  async handleListRuns(
    @Param("id") agentId: string,
    @Query("page") page?: string,
  ) {
    const result = await this.listRuns.execute({
      agentId,
      page: page ? parseInt(page, 10) : 1,
    });
    return PaginatedRunsResponseSchema.parse({
      data: result.runs.map((r) => formatRunResponse(r.toPrimitives())),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  }

  @Get("agents/:id/sessions")
  async handleListSessions(
    @Param("id") agentId: string,
    @Query("page") page?: string,
  ) {
    const result = await this.listSessions.execute({
      agentId,
      page: page ? parseInt(page, 10) : 1,
    });
    return PaginatedSessionsResponseSchema.parse({
      data: result.sessions.map((s) => formatSessionListItem(s.toPrimitives())),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  }

  @Get("agents/:id/sessions/:sessionId")
  async handleGetSession(
    @Param("sessionId") sessionId: string,
  ) {
    const result = await this.getSession.execute(sessionId);
    return SessionWithRunsResponseSchema.parse({
      session: formatSessionResponse(result.session.toPrimitives()),
      runs: result.runs.map((r) => formatRunResponse(r.toPrimitives())),
    });
  }

  @Get("agents/:id/metrics")
  async handleGetAgentMetrics(@Param("id") agentId: string) {
    const metrics = await this.getAgentMetrics.execute(agentId);
    return AgentMetricsResponseSchema.parse(metrics.toPrimitives());
  }

  @Get("dashboard/metrics")
  async handleGetDashboardMetrics(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId: string,
  ) {
    const agents = await this.listAgents.execute(organizationId);
    const agentIds = agents.map((a) => a.id);
    const metrics = await this.getDashboardMetrics.execute(agentIds);

    return DashboardMetricsResponseSchema.parse({
      totalAgents: agents.length,
      activeRuns: metrics.activeRuns,
      avgResponseTimeMs: metrics.avgDurationMs,
      totalCost: metrics.totalCost,
    });
  }
}
