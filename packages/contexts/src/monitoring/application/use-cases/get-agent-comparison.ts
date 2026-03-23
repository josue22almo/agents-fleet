import { RunStatus } from "../../domain/value-objects/run-status";
import type { RunRepository } from "../../ports/repositories/run-repository";
import type { AgentsContextPort } from "../../../_shared/domain/ports/agents-context-port";

interface AgentComparisonEntry {
  agentId: string;
  agentName?: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs: number;
  totalTokensUsed: number;
  totalCost: number;
}

export class GetAgentComparison {
  constructor(
    private readonly runRepo: RunRepository,
    private readonly agentsPort: AgentsContextPort,
  ) {}

  async execute(params: {
    organizationId: string;
  }): Promise<AgentComparisonEntry[]> {
    const agentIds = await this.agentsPort.getAgentIdsForOrganization(params.organizationId);

    if (agentIds.length === 0) {
      return [];
    }

    const [runs, agentNames] = await Promise.all([
      this.runRepo.findByAgentIds(agentIds),
      this.agentsPort.getAgentNamesByIds(agentIds),
    ]);

    if (runs.length === 0) {
      return [];
    }

    const agentMap = new Map<
      string,
      {
        totalRuns: number;
        completedRuns: number;
        failedRuns: number;
        totalDurationMs: number;
        durationCount: number;
        totalTokensUsed: number;
        totalCost: number;
      }
    >();

    for (const run of runs) {
      const p = run.toPrimitives();

      if (!agentMap.has(p.agentId)) {
        agentMap.set(p.agentId, {
          totalRuns: 0,
          completedRuns: 0,
          failedRuns: 0,
          totalDurationMs: 0,
          durationCount: 0,
          totalTokensUsed: 0,
          totalCost: 0,
        });
      }

      const entry = agentMap.get(p.agentId)!;
      entry.totalRuns++;

      if (p.status === RunStatus.COMPLETED) {
        entry.completedRuns++;
      }
      if (p.status === RunStatus.FAILED) {
        entry.failedRuns++;
      }
      if (p.durationMs !== null) {
        entry.totalDurationMs += p.durationMs;
        entry.durationCount++;
      }
      if (p.tokensUsed !== null) {
        entry.totalTokensUsed += p.tokensUsed;
      }
      if (p.cost !== null) {
        entry.totalCost += p.cost;
      }
    }

    return Array.from(agentMap.entries())
      .map(([agentId, stats]) => ({
        agentId,
        agentName: agentNames[agentId],
        totalRuns: stats.totalRuns,
        completedRuns: stats.completedRuns,
        failedRuns: stats.failedRuns,
        successRate:
          stats.totalRuns > 0
            ? (stats.completedRuns / stats.totalRuns) * 100
            : 0,
        avgDurationMs:
          stats.durationCount > 0
            ? stats.totalDurationMs / stats.durationCount
            : 0,
        totalTokensUsed: stats.totalTokensUsed,
        totalCost: stats.totalCost,
      }))
      .sort((a, b) => b.totalRuns - a.totalRuns);
  }
}
