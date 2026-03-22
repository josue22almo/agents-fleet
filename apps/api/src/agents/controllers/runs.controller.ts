import { Controller, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import { ListRuns, GetAgentMetrics, GetDashboardMetrics, type RunRepository } from "@repo/contexts/monitoring";
import { ListAgents, type AgentRepository } from "@repo/contexts/agents";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";

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

@Controller()
@UseGuards(JwtAuthGuard)
export class RunsController {
  private readonly listRuns: ListRuns;
  private readonly getAgentMetrics: GetAgentMetrics;
  private readonly getDashboardMetrics: GetDashboardMetrics;
  private readonly listAgents: ListAgents;

  constructor(
    @Inject("RunRepository") runRepo: RunRepository,
    @Inject("AgentRepository") agentRepo: AgentRepository,
  ) {
    this.listRuns = new ListRuns(runRepo);
    this.getAgentMetrics = new GetAgentMetrics(runRepo);
    this.getDashboardMetrics = new GetDashboardMetrics(runRepo);
    this.listAgents = new ListAgents(agentRepo);
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
    return {
      data: result.runs.map((r) => formatRunResponse(r.toPrimitives())),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @Get("agents/:id/metrics")
  async handleGetAgentMetrics(@Param("id") agentId: string) {
    const metrics = await this.getAgentMetrics.execute(agentId);
    return metrics.toPrimitives();
  }

  @Get("dashboard/metrics")
  async handleGetDashboardMetrics(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId: string,
  ) {
    const agents = await this.listAgents.execute(organizationId);
    const agentIds = agents.map((a) => a.id);
    const metrics = await this.getDashboardMetrics.execute(agentIds);

    return {
      totalAgents: agents.length,
      activeRuns: metrics.activeRuns,
      avgResponseTimeMs: metrics.avgDurationMs,
      totalCost: metrics.totalCost,
    };
  }
}
