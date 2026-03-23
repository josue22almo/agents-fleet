import { RunStatus } from "../../domain/value-objects/run-status";
import type { RunRepository } from "../../ports/repositories/run-repository";
import type { AgentsContextPort } from "../../../_shared/domain/ports/agents-context-port";
import { DashboardMetrics } from "../../domain/read-models/dashboard-metrics";

export class GetDashboardMetrics {
  constructor(
    private readonly runRepo: RunRepository,
    private readonly agentsPort: AgentsContextPort,
  ) {}

  async execute(organizationId: string): Promise<DashboardMetrics> {
    const agentIds = await this.agentsPort.getAgentIdsForOrganization(organizationId);

    if (agentIds.length === 0) {
      return DashboardMetrics.empty();
    }

    const runs = await this.runRepo.findByAgentIds(agentIds);

    let completedCount = 0;
    let totalDurationMs = 0;
    let durationCount = 0;
    let totalCost = 0;
    let activeRuns = 0;

    for (const run of runs) {
      const p = run.toPrimitives();
      if (p.status === RunStatus.COMPLETED) completedCount++;
      if (p.status === RunStatus.RUNNING) activeRuns++;
      if (p.durationMs !== null) { totalDurationMs += p.durationMs; durationCount++; }
      if (p.cost !== null) totalCost += p.cost;
    }

    const totalRuns = runs.length;
    const successRate = totalRuns > 0 ? completedCount / totalRuns : 0;
    const avgDurationMs = durationCount > 0 ? totalDurationMs / durationCount : 0;

    return DashboardMetrics.create({
      totalAgents: agentIds.length,
      totalRuns,
      successRate,
      avgDurationMs,
      avgResponseTimeMs: avgDurationMs,
      totalCost,
      activeRuns,
    });
  }
}
