import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import {
  PaginatedRunsResponseSchema,
  AgentMetricsResponseSchema,
  DashboardMetricsResponseSchema,
  DashboardChartDataResponseSchema,
  AgentComparisonResponseSchema,
  AgentUsageStatsResponseSchema,
  ToolCallSummaryResponseSchema,
  PaginatedSessionsResponseSchema,
  SessionWithRunsResponseSchema,
} from "@repo/contracts/agents";
import {
  ListRuns,
  GetAgentMetrics,
  GetDashboardMetrics,
  GetDashboardChartData,
  GetAgentComparison,
  GetAgentUsageStats,
  GetAgentToolCalls,
  ListSessions,
  GetSession,
  type RunRepository,
  type SessionRepository,
  type ToolCallRepository,
} from "@repo/contexts/monitoring";
import type { AgentsContextPort } from "@repo/contexts/_shared";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { formatRun } from "../mappers/format-run";
import { formatSession, formatSessionListItem } from "../mappers/format-session";

@Controller()
@UseGuards(JwtAuthGuard)
export class RunsController {
  private readonly listRuns: ListRuns;
  private readonly getAgentMetrics: GetAgentMetrics;
  private readonly getDashboardMetrics: GetDashboardMetrics;
  private readonly listSessions: ListSessions;
  private readonly getSession: GetSession;
  private readonly getDashboardChartData: GetDashboardChartData;
  private readonly getAgentComparison: GetAgentComparison;
  private readonly getAgentUsageStats: GetAgentUsageStats;
  private readonly getAgentToolCalls: GetAgentToolCalls;

  constructor(
    @Inject("RunRepository") runRepo: RunRepository,
    @Inject("AgentsContextPort") agentsPort: AgentsContextPort,
    @Inject("SessionRepository") sessionRepo: SessionRepository,
    @Inject("ToolCallRepository") toolCallRepo: ToolCallRepository,
  ) {
    this.listRuns = new ListRuns(runRepo);
    this.getAgentMetrics = new GetAgentMetrics(runRepo);
    this.getDashboardMetrics = new GetDashboardMetrics(runRepo, agentsPort);
    this.getDashboardChartData = new GetDashboardChartData(runRepo, agentsPort);
    this.getAgentComparison = new GetAgentComparison(runRepo, agentsPort);
    this.getAgentUsageStats = new GetAgentUsageStats(runRepo);
    this.getAgentToolCalls = new GetAgentToolCalls(toolCallRepo);
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
      data: result.runs.map((r) => formatRun(r.toPrimitives())),
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
      session: formatSession(result.session.toPrimitives()),
      runs: result.runs.map((r) => formatRun(r.toPrimitives())),
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
    const metrics = await this.getDashboardMetrics.execute(organizationId);
    return DashboardMetricsResponseSchema.parse(metrics.toPrimitives());
  }

  @Get("dashboard/charts")
  async handleDashboardCharts(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId: string,
  ) {
    const result = await this.getDashboardChartData.execute({ organizationId });
    return DashboardChartDataResponseSchema.parse(result.toPrimitives());
  }

  @Get("dashboard/comparison")
  async handleDashboardComparison(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId: string,
  ) {
    const result = await this.getAgentComparison.execute({ organizationId });
    return AgentComparisonResponseSchema.parse(result.map(e => e.toPrimitives()));
  }

  @Get("agents/:id/charts")
  async handleAgentCharts(@Param("id") agentId: string) {
    const result = await this.getDashboardChartData.execute({ agentIds: [agentId] });
    return DashboardChartDataResponseSchema.parse(result.toPrimitives());
  }

  @Get("agents/:id/usage")
  async handleAgentUsage(@Param("id") agentId: string) {
    const result = await this.getAgentUsageStats.execute({ agentId });
    return AgentUsageStatsResponseSchema.parse(result.toPrimitives());
  }

  @Get("agents/:id/tools")
  async handleAgentTools(@Param("id") agentId: string) {
    const result = await this.getAgentToolCalls.execute({ agentId });
    return ToolCallSummaryResponseSchema.parse(result.toPrimitives());
  }

}
